import { ChatSession } from '../../models/chatSession.model.js';
import { Message } from '../../models/message.model.js';
import { ProjectsService } from '../projects/projects.service.js';
import { AIProvidersService } from '../ai-providers/aiProviders.service.js';
import { OpenAICompatibleProvider } from '../ai-providers/openai-compatible.provider.js';
import { RetrievalService } from './retrieval.service.js';
import { AppError } from '../../utils/errors.js';

export class ChatService {
  private readonly projects = new ProjectsService();
  private readonly providers = new AIProvidersService();
  private readonly retrieval = new RetrievalService();
  private readonly ai = new OpenAICompatibleProvider();
  async send(userId: string, projectId: string, message: string, providerId: string, sessionId?: string) {
    await this.projects.getOwned(projectId, userId);
    const session = sessionId ? await ChatSession.findOne({ _id: sessionId, projectId, userId }) : await ChatSession.create({ projectId, userId });
    if (!session) throw new AppError(404, 'CHAT_NOT_FOUND', 'Chat session not found');
    await Message.create({ chatSessionId: session.id, role: 'user', content: message });
    const files = await this.retrieval.search(projectId, message);
    const answer = await this.ai.chat([{ role: 'system', content: 'Answer only from the supplied code context. If it is insufficient, say so.' }, { role: 'user', content: `Context:\n${files.map((file) => `${file.path}\n${file.content}`).join('\n\n').slice(0, 40_000)}\n\nQuestion: ${message}` }], await this.providers.getConfig(providerId, userId));
    await Message.create({ chatSessionId: session.id, role: 'assistant', content: answer });
    return { sessionId: session.id, answer };
  }
  async messages(userId: string, sessionId: string) {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) throw new AppError(404, 'CHAT_NOT_FOUND', 'Chat session not found');
    return Message.find({ chatSessionId: sessionId }).sort({ createdAt: 1 }).lean();
  }
}
