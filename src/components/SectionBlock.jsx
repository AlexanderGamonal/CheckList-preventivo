import React, { useState } from 'react';
import ItemCard from './ItemCard.jsx';

export default function SectionBlock({ section, devices, updateDevice, accentColor }) {
  const [open, setOpen] = useState(false);
  const filled = section.items.filter(
    (_, ii) => devices[section.id + "_" + ii]?.est !== "",
  ).length;
  const done = filled === section.items.length;
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 10,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 16px",
          background: done ? 'var(--color-action-green)' : accentColor || 'var(--brand)',
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {section.title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: done ? "var(--color-action-green)" : "rgba(255,255,255,.25)",
              color: "#fff",
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {filled}/{section.items.length}
          </span>
          <span style={{ fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>
      {open && (
        <div style={{ background: "var(--bg-primary)", padding: "12px 10px", borderTop: "1px solid var(--border-subtle)" }}>
          {section.items.map((item, ii) => (
            <ItemCard
              key={ii}
              label={item}
              state={
                devices[section.id + "_" + ii] || {
                  lim: false,
                  pru: false,
                  est: "",
                  obs: "",
                }
              }
              onChange={(f, v) =>
                updateDevice(section.id + "_" + ii, f, v)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}