import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/appError.js';
import { getSessionUser, readSessionCookie } from '../application/sessionStore.js';
import type { UserIdentity } from '../domain/organizationSeed.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserIdentity;
      sessionToken?: string | null;
    }
  }
}

export function attachSession(req: Request, _res: Response, next: NextFunction) {
  const token = readSessionCookie(req.header('cookie'));
  req.sessionToken = token;
  req.user = getSessionUser(token) ?? undefined;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new AppError('UNAUTHENTICATED', 'Sessão ausente ou expirada.', 401));
    return;
  }
  next();
}
