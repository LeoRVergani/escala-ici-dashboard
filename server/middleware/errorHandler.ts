import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../domain/appError.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.flatten(),
      },
      requestId: req.requestId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      requestId: req.requestId,
    });
    return;
  }

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno inesperado.',
    },
    requestId: req.requestId,
  });
};
