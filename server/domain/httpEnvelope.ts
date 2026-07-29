export interface SuccessEnvelope<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ErrorEnvelope {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export type HttpEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;
