import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '@/services/AuthGateway';
import { useAuthGateway } from './services';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Dev-only identity switch — undefined when the active gateway doesn't support it (e.g. a real MSAL gateway). */
  switchDevUser?: (user: AuthUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const gateway = useAuthGateway();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(gateway.getCurrentUser());
    setLoading(false);
  }, [gateway]);

  const signIn = async () => {
    const signedIn = await gateway.signIn();
    setUser(signedIn);
  };

  const signOut = async () => {
    await gateway.signOut();
    setUser(null);
  };

  const switchDevUser = gateway.signInAs
    ? async (nextUser: AuthUser) => {
        const signedIn = await gateway.signInAs!(nextUser);
        setUser(signedIn);
      }
    : undefined;

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, switchDevUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
