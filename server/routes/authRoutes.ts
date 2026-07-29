import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../domain/appError.js';
import { DEV_USERS } from '../domain/organizationSeed.js';
import { clearSessionCookie, createSession, destroySession, setSessionCookie } from '../application/sessionStore.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { sendOk } from '../app/responses.js';

const devSessionSchema = z.object({
  login: z.enum(['claudio', 'lvergani']).default('claudio'),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export function createAuthRoutes(config: AppConfig) {
  const router = Router();

  router.post('/dev-session', validateBody(devSessionSchema), (req, res, next) => {
    if (config.NODE_ENV !== 'development') {
      next(new AppError('DEV_AUTH_ENV_DENIED', 'Login de teste permitido somente em desenvolvimento.', 403));
      return;
    }
    if (!config.DEV_AUTH_ENABLED) {
      next(new AppError('DEV_AUTH_DISABLED', 'Login de teste desabilitado neste ambiente.', 403));
      return;
    }

    const baseUser = DEV_USERS[req.body.login];
    const user = req.body.displayName
      ? { ...baseUser, displayName: req.body.displayName }
      : baseUser;
    const token = createSession(user);
    setSessionCookie(res, token);
    sendOk(res, { user });
  });

  router.post('/logout', (req, res) => {
    destroySession(req.sessionToken ?? null);
    clearSessionCookie(res);
    sendOk(res, { signedOut: true });
  });

  router.post('/exchange-msal-token', async (req, res, next) => {
    const authorization = req.header('authorization') ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
    if (!token) {
      next(new AppError('MISSING_BEARER_TOKEN', 'Token Microsoft ausente.', 401));
      return;
    }
    if (!config.MSAL_TENANT_ID || !config.MSAL_CLIENT_ID) {
      next(new AppError('MSAL_NOT_CONFIGURED', 'Microsoft Entra ID ainda não configurado neste ambiente.', 503));
      return;
    }

    try {
      const issuer = `https://login.microsoftonline.com/${config.MSAL_TENANT_ID}/v2.0`;
      const jwks = createRemoteJWKSet(new URL(`${issuer}/discovery/v2.0/keys`));
      const result = await jwtVerify(token, jwks, {
        issuer,
        audience: config.MSAL_AUDIENCE || config.MSAL_CLIENT_ID,
      });
      const login =
        typeof result.payload.preferred_username === 'string'
          ? result.payload.preferred_username.split('@')[0]?.toLowerCase()
          : undefined;
      const user = login ? DEV_USERS[login] : undefined;
      if (!user) {
        next(new AppError('USER_NOT_AUTHORIZED', 'Usuário Microsoft não autorizado no MVP.', 403));
        return;
      }
      const sessionToken = createSession(user);
      setSessionCookie(res, sessionToken);
      sendOk(res, { user });
    } catch {
      next(new AppError('INVALID_MSAL_TOKEN', 'Token Microsoft inválido.', 401));
    }
  });

  router.get('/me', requireAuth, (req, res) => {
    sendOk(res, { user: req.user });
  });

  return router;
}
