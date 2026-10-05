import multer from 'multer';
import { AppError } from '../utils/errors.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isZip = file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.toLowerCase().endsWith('.zip');
    if (!isZip) return callback(new AppError(400, 'INVALID_ARCHIVE', 'Only ZIP archives are accepted'));
    callback(null, true);
  }
});
