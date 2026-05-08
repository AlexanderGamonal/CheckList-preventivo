import React from 'react';
import Tag from './Tag.jsx';
import { ESTADOS, E_COL, E_ICON } from '../constants/devices.js';

const INP = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-default)",
  fontSize: 14,
  background: "var(--bg-tertiary)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

export default function ItemCard({ label, state, onChange }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-default)",
        padding: "10px 12px",
        marginBottom: 8,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: 7,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
        <Tag
          label="Limpieza"
          active={state.lim}
          color="var(--brand)"
          onToggle={() => onChange("lim", !state.lim)}
        />
        <Tag
          label="Pruebas"
          active={state.pru}
          color="var(--brand)"
          onToggle={() => onChange("pru", !state.pru)}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 7 }}>
        {ESTADOS.map((e) => (
          <Tag
            key={e}
            label={`${E_ICON[e]} ${e}`}
            active={state.est === e}
            color={E_COL[e]}
            onToggle={() => onChange("est", state.est === e ? "" : e)}
          />
        ))}
      </div>
      <input
        type="text"
        placeholder="Observaciones…"
        value={state.obs}
        onChange={(e) => onChange("obs", e.target.value)}
        style={{ ...INP, fontSize: 12, background: "var(--bg-primary)", padding: "7px 10px" }}
      />
    </div>
  );
}
