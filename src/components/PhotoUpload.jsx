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

export default function PhotoUpload({ label, photos, setPhotos }) {
  const handleFiles = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) =>
        setPhotos((p) => [
          ...p,
          { name: file.name, src: ev.target.result },
        ]);
      r.readAsDataURL(file);
    });
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ ...LBL, marginBottom: 8 }}>{label}</p>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#f8fafc",
          border: "2px dashed #cbd5e1",
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
