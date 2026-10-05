import { File } from '../../models/file.model.js';
import { Review } from '../../models/review.model.js';
import { ProjectsService } from '../projects/projects.service.js';
import { AIProvidersService } from '../ai-providers/aiProviders.service.js';
import { OpenAICompatibleProvider } from '../ai-providers/openai-compatible.provider.js';
import { reviewOutputSchema } from './review.schema.js';
import { AppError } from '../../utils/errors.js';
import { reviewTemplates } from './templates/index.js';

type ReviewInput = { projectId: string; fileIds?: string[]; scope: 'SINGLE_FILE' | 'MULTI_FILE' | 'PROJECT'; template: 'SECURITY' | 'PERFORMANCE' | 'QUALITY'; providerId: string };
export class ReviewsService {
  private readonly projects = new ProjectsService();
  private readonly providers = new AIProvidersService();
  private readonly provider = new OpenAICompatibleProvider();

  async create(userId: string, input: ReviewInput) {
    await this.projects.getOwned(input.projectId, userId);
    if (input.scope === 'SINGLE_FILE' && input.fileIds?.length !== 1) throw new AppError(400, 'INVALID_SCOPE', 'SINGLE_FILE reviews require exactly one file');
    if (input.scope === 'MULTI_FILE' && (!input.fileIds || input.fileIds.length < 2)) throw new AppError(400, 'INVALID_SCOPE', 'MULTI_FILE reviews require at least two files');
    const query = input.fileIds?.length ? { _id: { $in: input.fileIds }, projectId: input.projectId } : { projectId: input.projectId };
    const files = await File.find(query).select('path content').lean();
    if (!files.length) throw new AppError(400, 'NO_FILES', 'No files are available for review');
    if (input.fileIds?.length && files.length !== new Set(input.fileIds).size) throw new AppError(400, 'INVALID_FILES', 'One or more selected files do not belong to this project');
    const review = await Review.create({ userId, projectId: input.projectId, fileIds: files.map((file) => file._id), scope: input.scope, template: input.template, status: 'pending' });
    try {
      const source = files.map((file) => `FILE: ${file.path}\n${file.content}`).join('\n\n').slice(0, 120_000);
      const messages = [
        { role: 'system', content: `${reviewTemplates[input.template.toLowerCase() as keyof typeof reviewTemplates] ?? input.template}. Respond with valid JSON matching {summary,issues,recommendations,severity}.` },
        { role: 'user', content: source }
      ] as const;
      const config = await this.providers.getConfig(input.providerId, userId);
      let raw = await this.provider.chat([...messages], config);
      let parsed;
      try {
        parsed = reviewOutputSchema.parse(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')));
      } catch {
        raw = await this.provider.chat([{ role: 'system', content: 'Return valid JSON only. Do not use Markdown fences.' }, ...messages], config);
        parsed = reviewOutputSchema.parse(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')));
      }
      await Review.updateOne({ _id: review.id }, { ...parsed, status: 'complete' });
    } catch (error) {
      await Review.updateOne({ _id: review.id }, { status: 'failed', error: error instanceof Error ? error.message : 'Review failed' });
    }
    return Review.findById(review.id).lean();
  }
  async list(userId: string, projectId: string, q?: string) {
    await this.projects.getOwned(projectId, userId);
    const search = q ? { $text: { $search: q } } : {};
    return Review.find({ userId, projectId, ...search }).sort({ createdAt: -1 }).lean();
  }
  async get(userId: string, id: string) {
    const review = await Review.findOne({ _id: id, userId }).lean();
    if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
    return review;
  }
}
