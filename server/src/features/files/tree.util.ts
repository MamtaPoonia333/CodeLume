export type FileTreeNode = { name: string; path: string; children?: FileTreeNode[] };

export function buildFileTree(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  for (const path of paths) {
    let current = root;
    const parts = path.split('/').filter(Boolean);
    let builtPath = '';
    parts.forEach((part, index) => {
      builtPath = builtPath ? `${builtPath}/${part}` : part;
      let node = current.find((candidate) => candidate.name === part);
      if (!node) {
        node = { name: part, path: builtPath };
        if (index < parts.length - 1) node.children = [];
        current.push(node);
      }
      if (node.children) current = node.children;
    });
  }
  const sort = (nodes: FileTreeNode[]) => nodes.sort((a, b) => Number(Boolean(b.children)) - Number(Boolean(a.children)) || a.name.localeCompare(b.name));
  const sortRecursive = (nodes: FileTreeNode[]) => { sort(nodes); nodes.forEach((node) => node.children && sortRecursive(node.children)); };
  sortRecursive(root);
  return root;
}
