export interface AuthUser {
  id: string;
  name: string;
  login: string;
}

export interface AuthGateway {
  signIn(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): AuthUser | null;
  /** Dev-only identity switch — implemented by DevAuthGateway, absent from any real (MSAL) gateway. */
  signInAs?(user: AuthUser): Promise<AuthUser>;
}
