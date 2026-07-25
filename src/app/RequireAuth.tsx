import type { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from './auth';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}
