import { useState, useEffect } from 'react';
import { initForm } from '../constants/devices.js';

const DRAFT_KEY = 'checklist_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

const normPhotos = (arr) => (arr || []).map(p => (typeof p === 'string' ? p : p?.src)).filter(Boolean);

export function useMpDraft() {
  const draft = loadDraft();
  const [form, setForm] = useState(draft?.form || initForm());
  const [fotosAntes, setFotosAntes] = useState(normPhotos(draft?.fotosAntes));
  const [fotosDespues, setFotosDespues] = useState(normPhotos(draft?.fotosDespues));
  const [tab, setTab] = useState(draft?.tab || 0);
  const [storageError, setStorageError] = useState(false);

  // Guardar borrador en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, fotosAntes, fotosDespues, tab }));
      setStorageError(false);
    } catch {
      setStorageError(true);
      // Fallback: guardar sin fotos para preservar al menos los campos de texto
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, fotosAntes: [], fotosDespues: [], tab }));
      } catch { /* sin espacio ni para la versión lite */ }
    }
  }, [form, fotosAntes, fotosDespues, tab]);

  return {
    form, setForm,
    fotosAntes, setFotosAntes,
    fotosDespues, setFotosDespues,
    tab, setTab,
    storageError,
    clearDraft,
  };
}
