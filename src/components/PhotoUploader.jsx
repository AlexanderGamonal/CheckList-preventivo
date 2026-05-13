import React, { useRef, useState } from 'react';

/* ── Pipeline: File → resize → WebP DataURL ── */
async function compressToWebP(file, maxW = 1200, maxH = 900, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale  = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.round(bitmap.width  * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return new Promise(res =>
    canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(blob);
    }, 'image/webp', quality)
  );
}

/* ──────────────────────────────────────────
   PhotoUploader
   props:
     photos   – string[]  (DataURLs)
     onChange – fn(newPhotos)
     min      – número mínimo requerido
     max      – número máximo permitido
     label    – string (opcional)
   ────────────────────────────────────────── */
export default function PhotoUploader({ photos = [], onChange, min = 1, max = 6, label }) {
  const cameraRef  = useRef();
  const galleryRef = useRef();
  const [loading, setLoading] = useState(false);

  async function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;
    const slots = max - photos.length;
    if (slots <= 0) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(files.slice(0, slots).map(f => compressToWebP(f)));
      onChange([...photos, ...compressed]);
    } catch (err) {
      console.error('Error comprimiendo imagen:', err);
    } finally {
      setLoading(false);
    }
  }

  function remove(idx) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  const count   = photos.length;
  const underMin = count < min;
  const atMax   = count >= max;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          letterSpacing: '0.3px', textTransform: 'uppercase',
        }}>
          {label}
        </div>
      )}

      {/* Contador + botones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          color:      underMin ? 'var(--status-critical)' : 'var(--status-ok)',
          background: underMin ? 'var(--status-critical-dim)' : 'var(--status-ok-dim)',
        }}>
          {count}/{max} {underMin ? `(mín. ${min})` : '✓'}
        </span>

        {!atMax && (
          <>
            {/* Primario — abre cámara trasera directamente en móvil */}
            <button
              type="button"
              disabled={loading}
              onClick={() => cameraRef.current?.click()}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1.5px solid var(--brand)',
                background: 'var(--brand-subtle)', color: 'var(--brand-light)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              {loading ? '⏳ Comprimiendo…' : '📷 Cámara'}
            </button>

            {/* Secundario — selector de galería */}
            <button
              type="button"
              disabled={loading}
              onClick={() => galleryRef.current?.click()}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1.5px dashed var(--border-default)',
                background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                fontSize: 12, fontWeight: 400, cursor: 'pointer',
                opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
              }}
            >
              🖼️ Galería
            </button>
          </>
        )}

        {/* Input cámara — capture="environment" fuerza cámara trasera en móvil */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />

        {/* Input galería — multiple permite seleccionar varias a la vez */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Grid de miniaturas */}
      {count > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 8,
        }}>
          {photos.map((src, idx) => (
            <div key={idx} style={{
              position: 'relative', borderRadius: 8, overflow: 'hidden',
              aspectRatio: '4/3', background: 'var(--bg-tertiary)',
            }}>
              <img
                src={src}
                alt={`foto-${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
              <div style={{
                position: 'absolute', bottom: 3, left: 4,
                fontSize: 10, color: '#fff',
                background: 'rgba(0,0,0,0.5)', padding: '1px 5px', borderRadius: 3,
              }}>{idx + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
