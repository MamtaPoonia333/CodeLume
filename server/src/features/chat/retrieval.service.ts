import { File } from '../../models/file.model.js';
export class RetrievalService {
  async search(projectId: string, query: string) {
    return File.find({ projectId, $text: { $search: query } }, { path: 1, content: 1, score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } }).limit(8).lean();
  }
}
