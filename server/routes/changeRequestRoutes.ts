import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
import { getChangeRequest, listChangeRequestsByTeam, resolveChangeRequest } from '../application/changeRequestStore.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { sendOk } from '../app/responses.js';

const resolutionSchema = z.object({
  note: z.string().optional(),
});

function ensureTeamAccess(teamId: string, user: Express.Request['user']) {
  const team = TEAMS.find((candidate) => candidate.id === teamId);
  if (!team) throw new AppError('TEAM_NOT_FOUND', 'Equipe não encontrada.', 404);
  if (!user || !canAccessTeam(user, team.id)) {
    throw new AppError('TEAM_FORBIDDEN', 'Usuário não autorizado para esta equipe.', 403);
  }
}

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function createChangeRequestRoutes() {
  const router = Router();

  router.get('/teams/:teamId/change-requests', requireAuth, (req, res, next) => {
    try {
      const teamId = paramValue(req.params.teamId);
      ensureTeamAccess(teamId, req.user);
      sendOk(res, listChangeRequestsByTeam(teamId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/change-requests/:id', requireAuth, (req, res, next) => {
    try {
      const request = getChangeRequest(paramValue(req.params.id));
      if (!request) {
        next(new AppError('CHANGE_REQUEST_NOT_FOUND', 'Solicitação de troca não encontrada.', 404));
        return;
      }
      ensureTeamAccess(request.requesterTeamId, req.user);
      sendOk(res, request);
    } catch (error) {
      next(error);
    }
  });

  for (const [action, status] of [
    ['approve', 'APPROVED'],
    ['reject', 'REJECTED'],
    ['cancel', 'CANCELLED'],
  ] as const) {
    router.post(`/change-requests/:id/${action}`, requireAuth, validateBody(resolutionSchema), (req, res, next) => {
      try {
        const request = getChangeRequest(paramValue(req.params.id));
        if (!request) {
          next(new AppError('CHANGE_REQUEST_NOT_FOUND', 'Solicitação de troca não encontrada.', 404));
          return;
        }
        ensureTeamAccess(request.requesterTeamId, req.user);
        const resolved = resolveChangeRequest({ id: request.id, status, user: req.user!, note: req.body.note });
        sendOk(res, resolved);
      } catch (error) {
        next(error);
      }
    });
  }

  return router;
}
