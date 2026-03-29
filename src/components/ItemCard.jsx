import React from 'react';
import Tag from './Tag.jsx';
import { ESTADOS, E_COL } from '../constants/devices.js';

const INP = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  background: "#fff",
  color: "#1e293b",
  outline: "none",
};

export default function ItemCard({ label, state, onChange }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: "10px 12px",
        marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.05)",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#334155",
          marginBottom: 7,
        }}
      >
        {label}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          marginBottom: 6,
        }}
      >
        <Tag
          label="Limpieza"
          active={state.lim}
          color="#2563eb"
          onToggle={() => onChange("lim", !state.lim)}
        />
        <Tag
          label="Pruebas"
          active={state.pru}
          color="#2563eb"
          onToggle={() => onChange("pru", !state.pru)}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 7,
        }}
      >
        {ESTADOS.map((e) => (
          <Tag
            key={e}
            label={e}
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
        style={{
          ...INP,
          fontSize: 12,
          background: "#f8fafc",
          padding: "7px 10px",
        }}
      />
    </div>
  );
}
