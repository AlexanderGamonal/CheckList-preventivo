import React, { useState } from 'react';

const LBL = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

const MAX_PX = 1280;
const QUALITY = 0.82;

function compressImage(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, MAX_PX / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  });
}

const MIN_PHOTOS = 5;

export default function PhotoUpload({ label, photos, setPhotos }) {
  const [loading, setLoading] = useState(false);
  const count = photos.length;
  const ok = count >= MIN_PHOTOS;
  const faltantes = Math.max(0, MIN_PHOTOS - count);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f)));
      setPhotos((p) => [...p, ...compressed.map((src, i) => ({ name: files[i].name, src }))]);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ ...LBL, marginBottom: 0 }}>{label}</p>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          background: ok ? "var(--status-ok-dim)" : "var(--status-critical-dim)",
          color: ok ? "var(--status-ok)" : "var(--status-critical)",
        }}>
          {ok ? `✓ ${count} fotos` : `${count}/${MIN_PHOTOS} — faltan ${faltantes}`}
        </span>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--bg-secondary)",
          border: `2px dashed ${ok ? "var(--status-ok-border)" : count > 0 ? "var(--status-critical-border)" : "var(--border-default)"}`,
          borderRadius: 10,
          padding: "14px 16px",
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        <span style={{ fontSize: 24 }}>{loading ? '⏳' : '📷'}</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {loading ? 'Comprimiendo…' : 'Toca para agregar fotos'}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={loading}
          style={{ display: "none" }}
        />
      </label>
      {photos.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
          }}
        >
          {photos.map((p, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={p.src}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "2px solid var(--border-default)",
                }}
              />
              <button
                onClick={() =>
                  setPhotos((prev) => prev.filter((_, j) => j !== i))
                }
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "var(--status-critical)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  fontSize: 13,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
