import React from 'react';

export default function Tag({ label, active, color, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "6px 11px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        border: "1.5px solid " + (active ? color : "#e2e8f0"),
        background: active ? color : "#fff",
        color: active ? "#fff" : "#94a3b8",
        transition: "all .15s",
        userSelect: "none",
      }}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}
