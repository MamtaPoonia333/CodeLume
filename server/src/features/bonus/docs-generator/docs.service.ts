import { File } from '../../../models/file.model.js';
import { ProjectsService } from '../../projects/projects.service.js';
import { AIProvidersService } from '../../ai-providers/aiProviders.service.js';
import { OpenAICompatibleProvider } from '../../ai-providers/openai-compatible.provider.js';

export class DocumentationService {
  private readonly projects = new ProjectsService();
  private readonly providers = new AIProvidersService();
  private readonly ai = new OpenAICompatibleProvider();
  async generate(userId: string, projectId: string, providerId: string) {
    await this.projects.getOwned(projectId, userId);
    const files = await File.find({ projectId }).select('path content').lean();
    return this.ai.chat([{ role: 'system', content: 'Generate concise Markdown documentation for this codebase, including overview, setup, architecture, and key modules.' }, { role: 'user', content: files.map((file) => `# ${file.path}\n${file.content}`).join('\n\n').slice(0, 100_000) }], await this.providers.getConfig(providerId, userId));
  }
}
