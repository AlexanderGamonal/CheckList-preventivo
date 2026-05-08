import React from 'react';

const ICONS = {
  ok: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  err: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <div className="spinner" aria-hidden="true" />
  ),
};

export default function Toast({ msg, type, onClose, aboveBar }) {
  const bg =
    type === "ok" ? "var(--color-action-green)" : type === "err" ? "var(--status-critical)" : "var(--brand)";

  React.useEffect(() => {
    if (type === "ok" || type === "err") {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [type]);

  return (
    <div className={`toast no-print${aboveBar ? " toast--above-bar" : ""}`} style={{ background: bg }} role="status" aria-live="polite">
      {ICONS[type] ?? ICONS.info}
      <span>{msg}</span>
    </div>
  );
}
