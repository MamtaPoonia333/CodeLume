import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/user.model.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

export class AuthService {
  async register(email: string, password: string) {
    const existing = await User.exists({ email });
    if (existing) throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
    }
    return {
      user: { id: user.id, email: user.email },
      token: jwt.sign({ email: user.email }, env.JWT_SECRET, { subject: user.id, expiresIn: '7d' })
    };
  }
}
