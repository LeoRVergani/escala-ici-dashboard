import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../domain/appError.js';

export function notFoundMiddleware(req: Request, _res: Response, next: NextFunction) {
  next(new AppError('NOT_FOUND', `Rota não encontrada: ${req.method} ${req.path}`, 404));
}
