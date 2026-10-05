'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
export default function ProjectLayout({ children }: Readonly<{ children: React.ReactNode }>) { const { id } = useParams<{ id: string }>(); return <main className="mx-auto max-w-6xl p-6 md:p-10"><nav className="mb-8 flex flex-wrap items-center gap-4 border-b border-slate-700 pb-4"><Link className="font-semibold" href="/dashboard">Projects</Link><span className="text-slate-500">/</span><Link href={`/project/${id}/explorer`}>Explorer</Link><Link href={`/project/${id}/review`}>Reviews</Link><Link href={`/project/${id}/chat`}>Chat</Link></nav>{children}</main>; }
