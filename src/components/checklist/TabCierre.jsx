import React from 'react';
import { INP, LBL } from './styles.js';

export default function TabCierre({ form, upd, marcaObj, accentBg, setTab }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {[
        ["obsGen", "Observaciones Generales", 3, true],
        ["rec", "Recomendaciones", 3, false],
      ].map(([f, l, r, required]) => (
        <div key={f}>
          <label style={LBL}>
            {l}
            {required && (
              <span style={{ color: "var(--status-critical)", marginLeft: 4 }}>*</span>
            )}
          </label>
          <textarea
            rows={r}
            value={form[f]}
            onChange={(e) => upd(f, e.target.value)}
            style={{
              ...INP,
              resize: "none",
              ...(required && !form[f]?.trim()
                ? { borderColor: "var(--status-critical-border)" }
                : {}),
            }}
            placeholder={required ? l + "… (obligatorio)" : l + "…"}
          />
        </div>
      ))}
      <div>
        <label style={LBL}>Estado Final del Equipo</label>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          {[
            ["Operativo",                    "✓", "var(--status-ok)",       "var(--status-ok-dim)"],
            ["Inoperativo",                  "✗", "var(--status-critical)", "var(--status-critical-dim)"],
            ["Operativo con observaciones",  "⚠", "var(--status-warn)",     "var(--status-warn-dim)"],
          ].map(([s, icon, c, bg]) => (
            <button
              key={s}
              onClick={() => upd("estFinal", s)}
              style={{
                padding: "13px 16px",
                minHeight: 44,
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                border: "2px solid " + (form.estFinal === s ? c : "var(--border-default)"),
                background: form.estFinal === s ? bg : "var(--bg-secondary)",
                color: form.estFinal === s ? c : "var(--text-muted)",
                textAlign: "left",
              }}
            >
              {icon} {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setTab(3)}
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
          onClick={() => setTab(5)}
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
          Siguiente → Fotos 📸
        </button>
      </div>
    </div>
  );
}
