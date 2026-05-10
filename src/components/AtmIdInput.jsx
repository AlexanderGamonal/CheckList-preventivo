import React, { useState, useCallback, useRef, useEffect } from 'react';
import { lookupAtm, searchAtmIds } from '../hooks/useAtmLookup.js';

export default function AtmIdInput({ value, onChange, onAutofill, onNotFound, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null); // null | 'found' | 'notfound' | 'loading'
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Precarga la caché al montar para que el primer tipeo sea instantáneo
  useEffect(() => { searchAtmIds('_preload_'); }, []);

  // Close dropdown when clicking outside
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
    const val = e.target.value;
    onChange(val);
    setStatus(null);
    clearTimeout(debounceRef.current);
    if (val.length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    setStatus('loading');
    debounceRef.current = setTimeout(async () => {
      const results = await searchAtmIds(val);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setStatus(results.length > 0 ? null : 'notfound');
    }, 0);
  }, [onChange]);

  const handleSelect = useCallback(async (idAtm) => {
    onChange(idAtm);
    setShowDropdown(false);
    setSuggestions([]);
    setStatus('loading');
    const atm = await lookupAtm(idAtm);
    if (atm) {
      setStatus('found');
      onAutofill(atm);
      onNotFound?.(false);
    } else {
      setStatus('notfound');
      onNotFound?.(true);
    }
  }, [onChange, onAutofill, onNotFound]);

  const handleBlur = useCallback(async () => {
    if (!value || value.length < 2) return;
    setTimeout(async () => {
      setShowDropdown(false);
      if (status === 'found') return;
      const atm = await lookupAtm(value);
      if (atm) { setStatus('found'); onAutofill(atm); onNotFound?.(false); }
      else { setStatus('notfound'); onNotFound?.(true); }
    }, 200);
  }, [value, status, onAutofill, onNotFound]);

  const borderColor = status === 'found' ? 'var(--status-ok)' : status === 'notfound' ? 'var(--status-warn)' : 'var(--border-default)';

  const INP = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1.5px solid ${borderColor}`,
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Ej: BBVA-0001 · SBP-001 · LHPE0001 · 100000000001"
        style={INP}
        autoComplete="off"
      />
      {status === 'found' && (
        <div style={{ position: 'absolute', fontSize: 11, color: 'var(--status-ok)', marginTop: 2, fontWeight: 600 }}>
          ✓ ATM encontrado
        </div>
      )}
      {status === 'notfound' && (
        <div style={{ position: 'absolute', fontSize: 11, color: 'var(--status-warn)', marginTop: 2 }}>
          ⚠ No encontrado en BD — ingrese datos manualmente
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          boxShadow: 'var(--shadow-md)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {suggestions.map(s => (
            <div
              key={s.id_atm}
              onMouseDown={() => handleSelect(s.id_atm)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 12,
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.id_atm}</span>
              <span style={{ color: 'var(--text-disabled)', marginLeft: 8 }}>{s.punto}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>{s.cliente}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
