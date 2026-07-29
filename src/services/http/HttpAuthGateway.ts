import type { AuthGateway, AuthUser } from '../AuthGateway';
import type { HttpApiClient } from './HttpApiClient';

const SESSION_KEY = 'escala-ici:http-session-user';

interface IdentityResponse {
  user: {
    id: string;
    displayName: string;
    login: string;
  };
}

function toAuthUser(response: IdentityResponse): AuthUser {
  return {
    id: response.user.id,
    name: response.user.displayName,
    login: response.user.login,
  };
}

export class HttpAuthGateway implements AuthGateway {
  private readonly apiClient: HttpApiClient;

  constructor(apiClient: HttpApiClient) {
    this.apiClient = apiClient;
  }

  async signIn(): Promise<AuthUser> {
    throw new Error('Informe um nome para iniciar a simulação local.');
  }

  async signInAs(user: AuthUser): Promise<AuthUser> {
    const signedIn = toAuthUser(
      await this.apiClient.post<IdentityResponse>('/api/auth/dev-session', {
        displayName: user.name,
      }),
    );
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(signedIn));
    return signedIn;
  }

  async signOut(): Promise<void> {
    await this.apiClient.post('/api/auth/logout');
    sessionStorage.removeItem(SESSION_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
