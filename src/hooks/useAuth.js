import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const role = session?.user?.user_metadata?.role || null;
  const isSuperadmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperadmin;

  return { session, loading, role, isAdmin, isSuperadmin };
}
