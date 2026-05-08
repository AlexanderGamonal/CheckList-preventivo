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
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
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
      e.target.value = '';
    }
  }

  function remove(idx) {
    onChange(photos.filter((_, i) => i !== idx));
  }

  const count  = photos.length;
  const underMin = count < min;
  const atMax  = count >= max;

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

      {/* Contador + botón */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          color:       underMin ? 'var(--status-critical)' : 'var(--status-ok)',
          background:  underMin ? 'var(--status-critical-dim)' : 'var(--status-ok-dim)',
        }}>
          {count}/{max} {underMin ? `(mín. ${min})` : '✓'}
        </span>

        {!atMax && (
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1.5px dashed var(--brand)',
              background: 'var(--brand-subtle)', color: 'var(--brand-light)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? '⏳ Comprimiendo…' : '📷 Agregar foto'}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
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
