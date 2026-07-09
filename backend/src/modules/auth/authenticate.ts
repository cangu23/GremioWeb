import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import * as UserRepository from '../../modules/users/user.repository';

interface JwtPayload {
  userId: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError('User for this token does not exist.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token.', 401));
  }
};