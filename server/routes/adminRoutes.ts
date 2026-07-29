import { Router } from 'express';
import { AppError } from '../domain/appError.js';
import { AREAS, DEV_USERS, TEAMS, isAdminLike } from '../domain/organizationSeed.js';
import { listAuditEvents, listOutboxEvents } from '../application/auditOutboxStore.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendOk } from '../app/responses.js';

function requireAdmin(user: Express.Request['user']) {
  if (!user || !isAdminLike(user)) {
    throw new AppError('ADMIN_FORBIDDEN', 'Acesso restrito a administradores.', 403);
  }
}

export function createAdminRoutes() {
  const router = Router();

  router.get('/admin/users', requireAuth, (req, res, next) => {
    try {
      requireAdmin(req.user);
      sendOk(res, Object.values(DEV_USERS));
    } catch (error) {
      next(error);
    }
  });

  router.post('/admin/users', requireAuth, (req, _res, next) => {
    try {
      requireAdmin(req.user);
      next(new AppError('ADMIN_USER_WRITE_NOT_IMPLEMENTED', 'Cadastro real de usuários entra na integração Firebase.', 501));
    } catch (error) {
      next(error);
    }
  });

  router.patch('/admin/users/:id', requireAuth, (req, _res, next) => {
    try {
      requireAdmin(req.user);
      next(new AppError('ADMIN_USER_WRITE_NOT_IMPLEMENTED', 'Edição real de usuários entra na integração Firebase.', 501));
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/teams', requireAuth, (req, res, next) => {
    try {
      requireAdmin(req.user);
      sendOk(res, { areas: AREAS, teams: TEAMS });
    } catch (error) {
      next(error);
    }
  });

  router.post('/admin/manager-assignments', requireAuth, (req, _res, next) => {
    try {
      requireAdmin(req.user);
      next(new AppError('ADMIN_ASSIGNMENT_WRITE_NOT_IMPLEMENTED', 'Atribuição real de gestores entra na integração Firebase.', 501));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/admin/manager-assignments/:id', requireAuth, (req, _res, next) => {
    try {
      requireAdmin(req.user);
      next(new AppError('ADMIN_ASSIGNMENT_WRITE_NOT_IMPLEMENTED', 'Remoção real de gestores entra na integração Firebase.', 501));
    } catch (error) {
      next(error);
    }
  });

  router.get('/admin/audit-events', requireAuth, (req, res, next) => {
    try {
      requireAdmin(req.user);
      sendOk(res, { auditEvents: listAuditEvents(), outboxEvents: listOutboxEvents() });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
