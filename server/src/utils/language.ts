const languages: Record<string, string> = { '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.py': 'python', '.java': 'java', '.go': 'go' };
export const languageFromPath = (path: string) => languages[path.slice(path.lastIndexOf('.'))] ?? 'text';
