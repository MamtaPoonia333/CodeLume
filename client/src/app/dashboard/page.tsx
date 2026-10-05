'use client';
import { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProjectCard } from '../../components/projects/ProjectCard';
export default function DashboardPage() {
  const { projects, loading, error, refresh } = useProjects(); const [name, setName] = useState(''); const [description, setDescription] = useState('');
  async function create() { if (!name.trim()) return; await api('/projects', { method: 'POST', body: JSON.stringify({ name, description }) }); setName(''); setDescription(''); await refresh(); }
  return <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-10"><header><p className="text-sm text-blue-400">Workspace</p><h1 className="text-3xl font-bold">Your projects</h1><p className="mt-2 text-slate-400">Upload code, review it, and ask questions with context.</p></header><section className="rounded border border-slate-700 bg-slate-900 p-5"><h2 className="mb-4 text-lg font-semibold">Create project</h2><div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"><Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} /><Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} /><Button onClick={() => void create()}>Create</Button></div></section>{error && <p className="text-red-400">{error}</p>}{loading ? <p>Loading projects…</p> : projects.length ? <section className="grid gap-4 md:grid-cols-2">{projects.map((project) => <ProjectCard key={project._id} project={project} />)}</section> : <p className="rounded border border-dashed border-slate-700 p-8 text-center text-slate-400">No projects yet.</p>}</main>;
}
