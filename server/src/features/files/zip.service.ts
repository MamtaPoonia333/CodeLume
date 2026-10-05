import unzipper from 'unzipper';
import { AppError } from '../../utils/errors.js';

const ignored = /(^|\/)(node_modules|\.git|dist|build|coverage)(\/|$)|\.(png|jpg|jpeg|gif|webp|ico|pdf|lock)$/i;
const maxFileBytes = 256 * 1024;
const maxFiles = 2_000;
const maxTotalBytes = 25 * 1024 * 1024;

export type ExtractedFile = { path: string; content: string; sizeBytes: number };

export class ZipService {
  async extract(buffer: Buffer): Promise<ExtractedFile[]> {
    const directory = await unzipper.Open.buffer(buffer);
    const files: ExtractedFile[] = [];
    let totalBytes = 0;
    for (const entry of directory.files) {
      const rawPath = entry.path.replaceAll('\\', '/');
      if (rawPath.startsWith('/') || /^[a-zA-Z]:\//.test(rawPath)) throw new AppError(400, 'ZIP_SLIP', 'Archive contains an unsafe path');
      const normalized = rawPath;
      if (!normalized || normalized.endsWith('/') || ignored.test(normalized)) continue;
      if (normalized.split('/').some((part) => part === '..')) throw new AppError(400, 'ZIP_SLIP', 'Archive contains an unsafe path');
      const data = await entry.buffer();
      if (data.length > maxFileBytes) continue;
      if (data.includes(0)) continue;
      totalBytes += data.length;
      if (files.length >= maxFiles || totalBytes > maxTotalBytes) throw new AppError(413, 'ARCHIVE_TOO_LARGE', 'Archive contains too many supported files');
      files.push({ path: normalized, content: data.toString('utf8'), sizeBytes: data.length });
    }
    return files;
  }
}
