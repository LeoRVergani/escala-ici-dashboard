import type { AuthGateway, AuthUser } from './AuthGateway';

const SESSION_KEY = 'escala-ici:dev-session';

const DEV_USER_CLAUDIO: AuthUser = {
  id: 'dev-claudio',
  name: 'Claudio',
  login: 'claudio.dev',
};

const DEV_USER_WMORIYAMA: AuthUser = {
  id: 'dev-wmoriyama',
  name: 'wmoriyama',
  login: 'wmoriyama',
};

export interface DevUserOption {
  user: AuthUser;
  title: string;
}

/** Every identity the dev-only user switcher can sign in as — never shown outside import.meta.env.DEV. */
export const DEV_USERS: DevUserOption[] = [
  { user: DEV_USER_CLAUDIO, title: 'Gestor de escalas' },
  { user: DEV_USER_WMORIYAMA, title: 'Coordenador de Infraestrutura de Data Center' },
];

export class DevAuthGateway implements AuthGateway {
  async signIn(): Promise<AuthUser> {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(DEV_USER_CLAUDIO));
    return DEV_USER_CLAUDIO;
  }

  async signInAs(user: AuthUser): Promise<AuthUser> {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
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
