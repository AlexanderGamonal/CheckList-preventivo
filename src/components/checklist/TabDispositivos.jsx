import React from 'react';
import SectionBlock from '../SectionBlock.jsx';

export default function TabDispositivos({ form, updD, sections, tipoObj, marcaObj, filled, total, setTab, accentBg }) {
  return (
    <div>
      {!form.atmTipo || !form.marca ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px 20px",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
          <p style={{ fontWeight: 700 }}>
            Selecciona tipo y marca en la pestaña Info
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              padding: "10px 14px",
              background: tipoObj.bg,
              borderRadius: 10,
              border: "1px solid " + tipoObj.border,
            }}
          >
            <span style={{ fontSize: 18 }}>{tipoObj.emoji}</span>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: tipoObj.color,
                }}
              >
                Cajero {tipoObj.label} ·{" "}
                <span style={{ color: marcaObj?.color }}>
                  {form.marca}
                </span>
                {form.punto && (
                  <span
                    style={{ color: "var(--text-muted)", fontWeight: 600 }}
                  >
                    {" "}
                    · {form.punto}
                  </span>
                )}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
                {filled}/{total} ítems evaluados
              </p>
            </div>
          </div>
          {sections.map((sec) => (
            <SectionBlock
              key={sec.id + sec.title}
              section={sec}
              devices={form.devices}
              updateDevice={updD}
              accentColor={
                sec.tipo === "disp"
                  ? marcaObj?.color || "#1d4ed8"
                  : sec.tipo === "dep"
                    ? "#166534"
                    : marcaObj?.color || tipoObj.color
              }
            />
          ))}
        </>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={() => setTab(2)}
          style={{
            flex: 1,
            padding: 12,
            background: "var(--bg-tertiary)",
            color: "var(--text-muted)",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><polyline points="15 18 9 12 15 6"/></svg>Atrás
        </button>
        <button
          onClick={() => setTab(4)}
          style={{
            flex: 2,
            padding: 12,
            background: marcaObj?.color || accentBg,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Siguiente → Cierre 📋
        </button>
      </div>
    </div>
  );
}
