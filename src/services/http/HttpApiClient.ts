export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  requestId: string;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: ApiErrorBody;
  requestId: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(input: {
    code: string;
    message: string;
    status: number;
    requestId?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = 'ApiClientError';
    this.code = input.code;
    this.status = input.status;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export class BackendOfflineError extends ApiClientError {
  constructor() {
    super({
      code: 'BACKEND_OFFLINE',
      message: 'Não foi possível conectar ao backend.',
      status: 0,
    });
    this.name = 'BackendOfflineError';
  }
}

export interface HttpApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class HttpApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor({ baseUrl, fetchImpl = fetch }: HttpApiClientOptions) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async request<T>(method: string, path: string): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers: {
          accept: 'application/json',
        },
      });
    } catch {
      throw new BackendOfflineError();
    }

    const body = (await response.json()) as ApiEnvelope<T>;
    if (body.ok) return body.data;

    throw new ApiClientError({
      code: body.error.code,
      message: body.error.message,
      status: response.status,
      requestId: body.requestId,
      details: body.error.details,
    });
  }
}
