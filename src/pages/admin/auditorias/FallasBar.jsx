import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FallasBar({ data }) {
  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-disabled)', fontSize: 13 }}>
      Sin fallas registradas
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={145} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="repuesto" name="Requiere repuesto" fill="#dc2626" stackId="s" />
        <Bar dataKey="manto" name="Requiere mantenimiento" fill="#d97706" stackId="s" />
      </BarChart>
    </ResponsiveContainer>
  );
}
