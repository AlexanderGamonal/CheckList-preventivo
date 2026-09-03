import React from 'react';

/* Grid de evidencia fotográfica para PDFs — 3 columnas, ratio 4:3,
   object-fit:contain (no recorta la foto). Mismo patrón ya usado en
   C2dPdfView.jsx y AuditPdfView.jsx. */
export default function PdfPhotoGrid({ photos = [] }) {
  if (!photos.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 4 }}>
      {photos.map((p, i) => (
        <div key={i} style={{
          position: 'relative', width: '100%', paddingTop: '75%',
          borderRadius: 3, overflow: 'hidden', border: '1px solid #999',
          background: '#f0f0f0',
        }}>
          <img src={typeof p === 'string' ? p : p.src} alt={`f${i + 1}`}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
            }} />
        </div>
      ))}
    </div>
  );
}
