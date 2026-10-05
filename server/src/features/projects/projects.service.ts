import { Project } from '../../models/project.model.js';
import { File } from '../../models/file.model.js';
import { Review } from '../../models/review.model.js';
import { ChatSession } from '../../models/chatSession.model.js';
import { Message } from '../../models/message.model.js';
import { AppError } from '../../utils/errors.js';

export class ProjectsService {
  list(userId: string) {
    return Project.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  create(userId: string, input: { name: string; description?: string }) {
    return Project.create({ userId, name: input.name.trim(), description: input.description?.trim() });
  }

  async getOwned(id: string, userId: string) {
    const project = await Project.findOne({ _id: id, userId }).lean();
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    return project;
  }

  async update(id: string, userId: string, input: { name?: string; description?: string }) {
    await this.getOwned(id, userId);
    const project = await Project.findOneAndUpdate(
      { _id: id, userId },
      { $set: { ...(input.name === undefined ? {} : { name: input.name.trim() }), ...(input.description === undefined ? {} : { description: input.description.trim() }) } },
      { new: true, runValidators: true }
    ).lean();
    if (!project) throw new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found');
    return project;
  }

  async remove(id: string, userId: string) {
    await this.getOwned(id, userId);
    const sessions = await ChatSession.find({ projectId: id }).select('_id').lean();
    await Message.deleteMany({ chatSessionId: { $in: sessions.map((session) => session._id) } });
    await Promise.all([
      ChatSession.deleteMany({ projectId: id }),
      Review.deleteMany({ projectId: id }),
      File.deleteMany({ projectId: id })
    ]);
    await Project.deleteOne({ _id: id, userId });
  }
}
