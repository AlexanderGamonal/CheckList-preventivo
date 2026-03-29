import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useTecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tecnicos')
      .select('id, nombre, num_interno')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        setTecnicos(data || []);
        setLoading(false);
      });
  }, []);

  return { tecnicos, loading };
}
