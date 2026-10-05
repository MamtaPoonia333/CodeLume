import { useState } from 'react';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
export function UploadZip({ projectId, onUploaded }: { projectId: string; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!file) return;
    setBusy(true); setError('');
    try { const form = new FormData(); form.append('zip', file); await api(`/projects/${projectId}/upload`, { method: 'POST', body: form }); onUploaded(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2"><div className="flex flex-wrap gap-2"><input type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><Button disabled={!file || busy} onClick={() => void submit()}>{busy ? 'Uploading…' : 'Upload ZIP'}</Button></div>{error && <p className="text-sm text-red-400">{error}</p>}</div>;
}
