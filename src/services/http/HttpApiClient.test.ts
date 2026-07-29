import { describe, expect, it, vi } from 'vitest';
import { BackendOfflineError, HttpApiClient } from './HttpApiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HttpApiClient', () => {
  it('unwraps success envelopes', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        ok: true,
        data: { version: '1.2.3' },
        requestId: 'req-1',
      }),
    );
    const client = new HttpApiClient({ baseUrl: 'http://127.0.0.1:3001/', fetchImpl });

    await expect(client.get<{ version: string }>('/api/version')).resolves.toEqual({
      version: '1.2.3',
    });
    expect(fetchImpl).toHaveBeenCalledWith('http://127.0.0.1:3001/api/version', {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
  });

  it('throws typed API errors', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        {
          ok: false,
          error: { code: 'NOT_FOUND', message: 'Não encontrado.' },
          requestId: 'req-404',
        },
        404,
      ),
    );
    const client = new HttpApiClient({ baseUrl: 'http://127.0.0.1:3001', fetchImpl });

    await expect(client.get('/api/missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
      requestId: 'req-404',
    });
  });

  it('reports backend offline separately from HTTP errors', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = new HttpApiClient({ baseUrl: 'http://127.0.0.1:3001', fetchImpl });

    await expect(client.get('/api/health')).rejects.toBeInstanceOf(BackendOfflineError);
  });
});
