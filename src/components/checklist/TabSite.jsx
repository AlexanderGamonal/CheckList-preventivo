import React from 'react';

export default function TabSite({ form, upd, setTab }) {
  return (
    <div>
      {/* Encabezado */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--brand-subtle)",
          border: "1px solid var(--border-brand)",
        }}
      >
        <span style={{ fontSize: 22 }}>🏢</span>
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "var(--brand-light)",
            }}
          >
            Evaluación del SITE
          </p>
          <p style={{ fontSize: 10, color: "var(--brand)" }}>
            Entorno y condiciones de la cabina
          </p>
        </div>
      </div>

      {[
        "Iluminación",
        "Ubicación / Accesibilidad",
        "Limpieza de Cabina",
        "Tacho de Papel / Basurero",
        "Aire Acondicionado / Ventilación",
        "Señalética y Adhesivos",
        "Estado Piso y Techo",
      ].map((item, i) => {
        const val = form.site[i] || "";
        const E_COL_SITE = {
          Bueno: "var(--status-ok)",
          Defectuoso: "var(--status-critical)",
          Regular: "var(--status-warn)",
          "No Aplica": "var(--status-offline)",
        };
        return (
          <div
            key={i}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 10,
              border:
                "2px solid " +
                (val ? E_COL_SITE[val] || "var(--border-default)" : "var(--border-default)"),
              padding: "12px 14px",
              marginBottom: 8,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  background: "var(--brand-subtle)",
                  color: "var(--brand-light)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 8px",
                  marginRight: 8,
                }}
              >
                {i + 1}
              </span>
              {item}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {[
                ["Bueno",      "✓", "var(--status-ok)"],
                ["Defectuoso", "✗", "var(--status-critical)"],
                ["Regular",    "⚠", "var(--status-warn)"],
                ["No Aplica",  "—", "var(--status-offline)"],
              ].map(([e, icon, col]) => (
                <button
                  key={e}
                  onClick={() => {
                    const s = { ...form.site };
                    s[i] = s[i] === e ? "" : e;
                    upd("site", s);
                  }}
                  style={{
                    padding: "7px 13px",
                    minHeight: 44,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "1.5px solid " + (val === e ? col : "var(--border-default)"),
                    background: val === e ? col : "var(--bg-secondary)",
                    color: val === e ? "#fff" : "var(--text-muted)",
                    transition: "all .15s",
                  }}
                >
                  {icon} {e}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={() => setTab(0)}
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
          onClick={() => setTab(2)}
          style={{
            flex: 2,
            padding: 12,
            background: "var(--brand)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Siguiente → Voltaje ⚡
        </button>
      </div>
    </div>
  );
}
