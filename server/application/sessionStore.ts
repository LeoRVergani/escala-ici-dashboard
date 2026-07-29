import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import type { UserIdentity } from '../domain/organizationSeed.js';

const COOKIE_NAME = 'escala_ici_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const sessions = new Map<string, { user: UserIdentity; expiresAt: number }>();

export function createSession(user: UserIdentity): string {
  const token = randomUUID();
  sessions.set(token, {
    user,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
  return token;
}

export function getSessionUser(token: string | null): UserIdentity | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

export function destroySession(token: string | null): void {
  if (token) sessions.delete(token);
}

export function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const sessionCookie = cookies.find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!sessionCookie) return null;
  return decodeURIComponent(sessionCookie.slice(COOKIE_NAME.length + 1));
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/api',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/api',
  });
}
