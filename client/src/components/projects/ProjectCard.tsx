import type { ApiProject } from '../../types';
import Link from 'next/link';
export function ProjectCard({ project }: { project: ApiProject }) { return <article className="rounded border border-slate-700 bg-slate-900 p-4"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-400">{project.description || 'No description'}</p></div><Link className="rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600" href={`/project/${project._id}/explorer`}>Open</Link></div></article>; }
