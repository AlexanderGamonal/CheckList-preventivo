import React from 'react';

const LBL = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: "#94a3b8",
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
  const count = photos.length;
  const ok = count >= MIN_PHOTOS;
  const faltantes = Math.max(0, MIN_PHOTOS - count);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const src = await compressImage(file);
      setPhotos((p) => [...p, { name: file.name, src }]);
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
          background: ok ? "#dcfce7" : "#fee2e2",
          color: ok ? "#15803d" : "#b91c1c",
        }}>
          {ok ? `✓ ${count} fotos` : `${count}/${MIN_PHOTOS} — faltan ${faltantes}`}
        </span>
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#f8fafc",
          border: `2px dashed ${ok ? "#86efac" : count > 0 ? "#fca5a5" : "#cbd5e1"}`,
          borderRadius: 10,
          padding: "14px 16px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 24 }}>📷</span>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          Toca para agregar fotos
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
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
                  border: "2px solid #e2e8f0",
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
                  background: "#ef4444",
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
