import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-request-id')?.trim();
  req.requestId = incoming || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}
