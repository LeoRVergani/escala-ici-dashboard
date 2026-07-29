import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';

export function httpLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = performance.now();
    res.on('finish', () => {
      logger.info(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(performance.now() - startedAt),
        },
        'http_request',
      );
    });
    next();
  };
}
