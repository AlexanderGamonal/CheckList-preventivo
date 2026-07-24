import React from 'react';

export default function Section({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
