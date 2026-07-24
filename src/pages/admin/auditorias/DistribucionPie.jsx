import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PIE_FILL } from './constants.js';

export default function DistribucionPie({ counts, total }) {
  const data = [
    { name: 'ACEPTAR',  value: counts.ACEPTAR  || 0 },
    { name: 'OBSERVAR', value: counts.OBSERVAR || 0 },
    { name: 'RECHAZAR', value: counts.RECHAZAR || 0 },
  ].filter(d => d.value > 0);

  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-disabled)', fontSize: 13 }}>
      Sin datos
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
          {data.map(entry => <Cell key={entry.name} fill={PIE_FILL[entry.name]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
          formatter={(v, n) => [`${v} ATMs (${total ? ((v / total) * 100).toFixed(0) : 0}%)`, n]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
