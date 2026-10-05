'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
export type CurrentUser = { id: string; email?: string };
export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    try { setUser((await api<{ user: CurrentUser }>('/auth/me')).user); } catch { setUser(null); }
    finally { setReady(true); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { user, ready, refresh };
}
