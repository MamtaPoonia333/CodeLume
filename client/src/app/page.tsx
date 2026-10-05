export default function HomePage() {
  return <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-6"><p className="text-sm font-semibold uppercase tracking-widest text-blue-400">AI-powered code review</p><h1 className="text-5xl font-bold tracking-tight">Understand your codebase faster.</h1><p className="max-w-2xl text-lg text-slate-300">Upload a project, run security, performance, and quality reviews, then chat with your code using focused retrieval.</p><div className="flex gap-3"><a className="rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500" href="/register">Get started</a><a className="rounded border border-slate-600 px-4 py-2 font-medium hover:bg-slate-800" href="/login">Log in</a></div>
  </main>;
}
