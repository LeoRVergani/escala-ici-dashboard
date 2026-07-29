import type { Response } from 'express';
import type { SuccessEnvelope } from '../domain/httpEnvelope.js';

export function sendOk<T>(res: Response, data: T) {
  const body: SuccessEnvelope<T> = {
    ok: true,
    data,
    requestId: res.req.requestId,
  };
  res.json(body);
}
