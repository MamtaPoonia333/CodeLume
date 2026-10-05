'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ApiProject } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setProjects((await api<{ projects: ApiProject[] }>('/projects')).projects); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load projects'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { projects, loading, error, refresh, setProjects };
}
