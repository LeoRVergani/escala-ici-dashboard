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
    const user = toAuthUser(
      await this.apiClient.post<IdentityResponse>('/api/auth/dev-session', { login: 'claudio' }),
    );
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async signInAs(user: AuthUser): Promise<AuthUser> {
    const login = user.login === 'claudio' ? 'claudio' : 'lvergani';
    const signedIn = toAuthUser(
      await this.apiClient.post<IdentityResponse>('/api/auth/dev-session', {
        login,
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
