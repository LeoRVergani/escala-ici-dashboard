export interface AuthUser {
  id: string;
  name: string;
  login: string;
}

export interface AuthGateway {
  signIn(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
}
