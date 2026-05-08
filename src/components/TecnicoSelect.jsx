import React from 'react';
import { useTecnicos } from '../hooks/useTecnicos.js';

const INP = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--border-default)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

export default function TecnicoSelect({ value, onChange, style }) {
  const { tecnicos, loading } = useTecnicos();

  return (
    <select
      value={value}
      onChange={e => {
        const selected = tecnicos.find(t => t.nombre === e.target.value);
        onChange(e.target.value, selected);
      }}
      style={{ ...INP, cursor: 'pointer', ...style }}
      disabled={loading}
    >
      <option value="">{loading ? 'Cargando tecnicos...' : 'Seleccionar tecnico'}</option>
      {tecnicos.map(t => (
        <option key={t.id} value={t.nombre}>
          {t.nombre} ({t.num_interno})
        </option>
      ))}
    </select>
  );
}
