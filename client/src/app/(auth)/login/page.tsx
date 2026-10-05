'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); router.push('/dashboard'); } catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); } finally { setBusy(false); } }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-6"><form onSubmit={submit} className="w-full space-y-4 rounded border border-slate-700 bg-slate-900 p-6"><h1 className="text-2xl font-bold">Log in</h1><Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><Input required minLength={8} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p className="text-sm text-red-400">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button><p className="text-sm text-slate-400">No account? <Link className="text-blue-400" href="/register">Register</Link></p></form></main>;
}
