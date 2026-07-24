import React from 'react';

export default function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-disabled)', fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      {msg}
    </div>
  );
}
