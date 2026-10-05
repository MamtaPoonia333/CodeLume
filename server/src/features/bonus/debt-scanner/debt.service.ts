import { File } from '../../../models/file.model.js';
import { ProjectsService } from '../../projects/projects.service.js';

const patterns = [
  { code: 'TODO', pattern: /\bTODO\b/g, message: 'TODO marker remains in source' },
  { code: 'CONSOLE', pattern: /\bconsole\.log\s*\(/g, message: 'Console logging should use the application logger' },
  { code: 'ANY', pattern: /\bany\b/g, message: 'Explicit any reduces type safety' }
];
export class DebtService {
  private readonly projects = new ProjectsService();
  async scan(userId: string, projectId: string) {
    await this.projects.getOwned(projectId, userId);
    const files = await File.find({ projectId }).select('path content').lean();
    return files.flatMap((file) => patterns.flatMap((item) => Array.from(file.content.matchAll(item.pattern), (match) => ({ file: file.path, line: file.content.slice(0, match.index ?? 0).split('\n').length, code: item.code, message: item.message }))));
  }
}
