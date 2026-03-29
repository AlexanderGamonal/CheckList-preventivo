import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const INP = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', background: '#f8fafc',
  color: '#0f172a', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

async function searchTecnicos(partial) {
  if (!partial || partial.length < 1) return [];
  const { data, error } = await supabase
    .from('tecnicos')
    .select('id, nombre, num_interno')
    .ilike('num_interno', `%${partial}%`)
    .eq('activo', true)
    .order('num_interno')
    .limit(8);
  if (error) return [];
  return data || [];
}

export default function TecnicoNumInput({ value, onChange, onAutofill, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null); // null | 'found' | 'notfound' | 'loading'
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = useCallback((e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8); // solo dígitos, máx 8
    onChange(val);
    setStatus(null);
    clearTimeout(debounceRef.current);
    if (val.length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    setStatus('loading');
    debounceRef.current = setTimeout(async () => {
      const results = await searchTecnicos(val);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setStatus(results.length > 0 ? null : 'notfound');
    }, 250);
  }, [onChange]);

  const handleSelect = useCallback((tecnico) => {
    onChange(tecnico.num_interno);
    setShowDropdown(false);
    setSuggestions([]);
    setStatus('found');
    onAutofill({ nombre: tecnico.nombre, num_interno: tecnico.num_interno, id: tecnico.id });
  }, [onChange, onAutofill]);

  const borderColor = status === 'found' ? '#16a34a' : status === 'notfound' ? '#d97706' : '#e2e8f0';

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => value.length >= 1 && suggestions.length > 0 && setShowDropdown(true)}
        placeholder="Ej: 10000001"
        maxLength={8}
        inputMode="numeric"
        style={{ ...INP, borderColor }}
        autoComplete="off"
      />
      {status === 'found' && (
        <div style={{ position: 'absolute', fontSize: 10, color: '#16a34a', marginTop: 2, fontWeight: 600 }}>
          ✓ Técnico encontrado
        </div>
      )}
      {status === 'notfound' && (
        <div style={{ position: 'absolute', fontSize: 10, color: '#d97706', marginTop: 2 }}>
          ⚠ No encontrado
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map(t => (
            <div
              key={t.id}
              onMouseDown={() => handleSelect(t)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{t.num_interno}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{t.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
