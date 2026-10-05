'use client';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import type { ApiFile, TreeNode } from '../../../../types';
import { FileTree } from '../../../../components/explorer/FileTree';
import { CodeViewer } from '../../../../components/explorer/CodeViewer';
import { UploadZip } from '../../../../components/projects/UploadZip';
export default function ExplorerPage() {
  const { id } = useParams<{ id: string }>(); const [files, setFiles] = useState<ApiFile[]>([]); const [tree, setTree] = useState<TreeNode[]>([]); const [content, setContent] = useState('Select a file to preview.'); const [selected, setSelected] = useState('');
  const load = useCallback(async () => { const [fileResult, treeResult] = await Promise.all([api<{ files: ApiFile[] }>(`/projects/${id}/files`), api<{ tree: TreeNode[] }>(`/projects/${id}/tree`)]); setFiles(fileResult.files); setTree(treeResult.tree); }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function select(path: string) { const file = files.find((item) => item.path === path); if (!file) return; setSelected(path); setContent(await api<string>(`/files/${file._id}/content`)); }
  return <section className="space-y-6"><header><h1 className="text-2xl font-bold">Code explorer</h1><p className="text-sm text-slate-400">{files.length} files</p></header><UploadZip projectId={id} onUploaded={() => void load()} /><div className="grid min-h-[500px] gap-4 md:grid-cols-[260px_1fr]"><aside className="rounded border border-slate-700 bg-slate-900 p-4"><FileTree tree={tree} onSelect={(path) => void select(path)} /></aside><section className="rounded border border-slate-700 bg-slate-950 p-4"><h2 className="mb-3 text-sm text-slate-400">{selected || 'Preview'}</h2><CodeViewer content={content} /></section></div></section>;
}
