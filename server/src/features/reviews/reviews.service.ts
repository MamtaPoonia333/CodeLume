import { File } from '../../models/file.model.js';
import { Review } from '../../models/review.model.js';
import { ProjectsService } from '../projects/projects.service.js';
import { AIProvidersService } from '../ai-providers/aiProviders.service.js';
import { OpenAICompatibleProvider } from '../ai-providers/openai-compatible.provider.js';
import { reviewOutputSchema } from './review.schema.js';
import { AppError } from '../../utils/errors.js';
import { reviewTemplates } from './templates/index.js';

type ReviewInput = { projectId: string; fileIds?: string[]; scope: 'SINGLE_FILE' | 'MULTI_FILE' | 'PROJECT'; template: 'SECURITY' | 'PERFORMANCE' | 'QUALITY'; providerId: string };

function parseReviewOutput(raw: string) {
  const value = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')) as Record<string, unknown>;
  const normalizeSeverity = (severity: unknown) => typeof severity === 'string' ? severity.toUpperCase() : severity;
  const issues = Array.isArray(value.issues)
    ? value.issues.map((issue) => typeof issue === 'object' && issue !== null
      ? { ...(issue as Record<string, unknown>), severity: normalizeSeverity((issue as Record<string, unknown>).severity) }
      : issue)
    : value.issues;
  const recommendations = Array.isArray(value.recommendations)
    ? value.recommendations.map((recommendation) => typeof recommendation === 'string' ? recommendation : JSON.stringify(recommendation))
    : value.recommendations;
  return reviewOutputSchema.parse({ ...value, issues, recommendations, severity: normalizeSeverity(value.severity) });
}

export class ReviewsService {
  private static readonly maxSourceLength = 2_500;
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
    const review = await Review.create({ userId, projectId: input.projectId, fileIds: files.map((file) => file._id), scope: input.scope, template: input.template, status: 'processing' });
    void this.process(review.id, userId, input, files.map((file) => ({ path: file.path, content: file.content })));
    return Review.findById(review.id).lean();
  }

  private async process(reviewId: string, userId: string, input: ReviewInput, files: Array<{ path: string; content: string }>) {
    try {
      const source = files.map((file) => `FILE: ${file.path}\n${file.content}`).join('\n\n').slice(0, ReviewsService.maxSourceLength);
      const messages = [
        { role: 'system', content: `${reviewTemplates[input.template.toLowerCase() as keyof typeof reviewTemplates] ?? input.template}. Respond with valid JSON matching {summary,issues,recommendations,severity}.` },
        { role: 'user', content: source }
      ] as const;
      const config = await this.providers.getConfig(input.providerId, userId);
      let raw = await this.provider.chat([...messages], config);
      let parsed;
      try {
        parsed = parseReviewOutput(raw);
      } catch (error) {
        if (error instanceof Error && error.message === 'AI provider request timed out') throw error;
        raw = await this.provider.chat([{ role: 'system', content: 'Return valid JSON only. Do not use Markdown fences.' }, ...messages], config);
        parsed = parseReviewOutput(raw);
      }
      await Review.updateOne({ _id: reviewId }, { ...parsed, status: 'complete', error: undefined });
    } catch (error) {
      await Review.updateOne({ _id: reviewId }, { status: 'failed', error: error instanceof Error ? error.message : 'Review failed' });
    }
  }
  async list(userId: string, projectId: string, q?: string) {
    await this.projects.getOwned(projectId, userId);
    await Review.updateMany(
      { userId, projectId, status: { $in: ['pending', 'processing'] }, updatedAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } },
      { status: 'failed', error: 'Review was interrupted before it finished. Run it again.' }
    );
    const search = q ? { $text: { $search: q } } : {};
    return Review.find({ userId, projectId, ...search }).sort({ createdAt: -1 }).lean();
  }
  async get(userId: string, id: string) {
    const review = await Review.findOne({ _id: id, userId }).lean();
    if (!review) throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
    return review;
  }
}
