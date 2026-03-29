import React from 'react';

export default function Toast({ msg, type, onClose }) {
  const bg =
    type === "ok" ? "#16a34a" : type === "err" ? "#dc2626" : "#2563eb";
  const icon = type === "ok" ? "✅" : type === "err" ? "❌" : "⏳";
  React.useEffect(() => {
    if (type === "ok" || type === "err") {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [type]);
  return (
    <div className="toast no-print" style={{ background: bg }}>
      <span>{icon}</span>
      <span>{msg}</span>
    </div>
  );
}
