import React from 'react';

export default function Tag({ label, active, color, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "10px 12px",
        minHeight: 44,
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        border: "1.5px solid " + (active ? color : "var(--border-default)"),
        background: active ? color : "var(--bg-secondary)",
        color: active ? "#fff" : "var(--text-muted)",
        transition: "all .15s",
        userSelect: "none",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {active ? "✓ " : ""}
      {label}
    </button>
  );
}
