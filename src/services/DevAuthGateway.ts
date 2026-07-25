import type { AuthGateway, AuthUser } from './AuthGateway';

const SESSION_KEY = 'escala-ici:dev-session';

const DEV_USER: AuthUser = {
  id: 'dev-claudio',
  name: 'Claudio',
  login: 'claudio.dev',
};

export class DevAuthGateway implements AuthGateway {
  async signIn(): Promise<AuthUser> {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(DEV_USER));
    return DEV_USER;
  }

  async signOut(): Promise<void> {
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
