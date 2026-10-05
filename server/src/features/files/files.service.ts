import { File } from '../../models/file.model.js';
import { Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service.js';
import { languageFromPath } from '../../utils/language.js';
import { ZipService, type ExtractedFile } from './zip.service.js';
import { AppError } from '../../utils/errors.js';
import { buildFileTree } from './tree.util.js';

export class FilesService {
  constructor(private readonly projects = new ProjectsService(), private readonly zip = new ZipService()) {}
  async upload(projectId: string, userId: string, buffer: Buffer) {
    await this.projects.getOwned(projectId, userId);
    const extracted = await this.zip.extract(buffer);
    if (!extracted.length) throw new AppError(400, 'EMPTY_ARCHIVE', 'The archive contains no supported text files');
    const ownerProjectId = new Types.ObjectId(projectId);
    const documents = extracted.map((file: ExtractedFile) => ({ ...file, projectId: ownerProjectId, language: languageFromPath(file.path) }));
    await File.bulkWrite(documents.map((document) => ({
      updateOne: { filter: { projectId: ownerProjectId, path: document.path }, update: { $set: document }, upsert: true }
    })));
    return { count: extracted.length };
  }
  async list(projectId: string, userId: string) {
    await this.projects.getOwned(projectId, userId);
    return File.find({ projectId }).select('-content').sort({ path: 1 }).lean();
  }

  async tree(projectId: string, userId: string) {
    const files = await this.list(projectId, userId);
    return buildFileTree(files.map((file) => file.path));
  }

  async remove(fileId: string, userId: string) {
    const file = await File.findById(fileId).select('projectId');
    if (!file) throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    await this.projects.getOwned(file.projectId.toString(), userId);
    await File.deleteOne({ _id: fileId });
  }
  async content(fileId: string, userId: string) {
    const file = await File.findById(fileId);
    if (!file) throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    await this.projects.getOwned(file.projectId.toString(), userId);
    return file;
  }
}
