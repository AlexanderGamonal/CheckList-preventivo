import React from 'react';

const TABS = [
  "🗂 Info",
  "🏢 Site",
  "⚡ Voltaje",
  "🔧 Dispositivos",
  "📋 Cierre",
  "📸 Fotos",
];

export default function ChecklistHeader({
  pct, progressColor, theme, toggleTheme,
  tab, setTab, hoveredTab, setHoveredTab, tabOk, storageError, onBack,
}) {
  return (
    <>
      {/* HEADER — siempre oscuro */}
      <div
        style={{
          background: "var(--bg-primary)",
          padding: "14px 14px 0",
          position: "sticky",
          top: 0,
          zIndex: "var(--z-sticky)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <button onClick={onBack}
                style={{ background: 'var(--hover-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Check List MP</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Selecciona el tipo de cajero</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{pct}%</span>
              <div style={{ width: 64, height: 5, borderRadius: 99, background: 'var(--border-strong)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: progressColor, borderRadius: 99, transition: 'width 0.3s ease, background 0.3s ease' }} />
              </div>
            </div>
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1, opacity: 0.75 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              onMouseEnter={() => setHoveredTab(i)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                flex: "0 0 auto",
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                background: tab === i ? "var(--bg-tertiary)" : hoveredTab === i ? "var(--hover-overlay)" : "transparent",
                color: tab === i ? "var(--text-primary)" : hoveredTab === i ? "var(--text-secondary)" : "var(--text-muted)",
                border: "none",
                borderBottom: tab === i ? "2px solid var(--brand)" : "2px solid transparent",
                cursor: "pointer",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              {t}
              <span style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: tabOk[i] ? "var(--status-ok)" : "var(--status-warn)",
              }} />
            </button>
          ))}
        </div>
      </div>

      {/* Banner almacenamiento lleno */}
      {storageError && (
        <div style={{
          background: 'var(--status-warn)', color: '#fff',
          padding: '8px 16px', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span>
          <span>Almacenamiento lleno — las fotos no se guardarán si recargas. Los datos del formulario sí están guardados. Puedes enviar normalmente.</span>
        </div>
      )}
    </>
  );
}
