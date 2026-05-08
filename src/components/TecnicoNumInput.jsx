import React, { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const INP = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--border-default)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

// Caché de módulo — se carga una sola vez por sesión
let tecCache = null;
let cachePromise = null;

function getCache() {
  if (tecCache) return Promise.resolve(tecCache);
  if (!cachePromise) {
    cachePromise = supabase
      .from('tecnicos')
      .select('id, nombre, num_interno')
      .eq('activo', true)
      .order('num_interno')
      .then(({ data }) => {
        tecCache = data || [];
        return tecCache;
      });
  }
  return cachePromise;
}

async function searchTecnicos(partial) {
  if (!partial || partial.length < 1) return [];
  const cache = await getCache();
  const q = partial.toLowerCase();
  return cache
    .filter(t => t.num_interno.toLowerCase().includes(q))
    .slice(0, 8);
}

export default function TecnicoNumInput({ value, onChange, onAutofill, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { getCache(); }, []);

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
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
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
    }, 0);
  }, [onChange]);

  const handleSelect = useCallback((tecnico) => {
    onChange(tecnico.num_interno);
    setShowDropdown(false);
    setSuggestions([]);
    setStatus('found');
    onAutofill({ nombre: tecnico.nombre, num_interno: tecnico.num_interno, id: tecnico.id });
  }, [onChange, onAutofill]);

  const borderColor =
    status === 'found'    ? 'var(--status-ok)'   :
    status === 'notfound' ? 'var(--status-warn)'  :
    'var(--border-default)';

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
        <div style={{ position: 'absolute', fontSize: 10, color: 'var(--status-ok)', marginTop: 2, fontWeight: 600 }}>
          ✓ Técnico encontrado
        </div>
      )}
      {status === 'notfound' && (
        <div style={{ position: 'absolute', fontSize: 10, color: 'var(--status-warn)', marginTop: 2 }}>
          ⚠ No encontrado
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {suggestions.map(t => (
            <div
              key={t.id}
              onMouseDown={() => handleSelect(t)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-overlay)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.num_interno}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
