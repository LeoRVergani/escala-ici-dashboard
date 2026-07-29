import { Router } from 'express';
import { AppError } from '../domain/appError.js';
import {
  AREAS,
  SEED_ORG_ICI_ID,
  TEAMS,
  canAccessArea,
  canAccessTeam,
  isAdminLike,
} from '../domain/organizationSeed.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendOk } from '../app/responses.js';

export function createOrganizationRoutes() {
  const router = Router();

  router.get('/me', requireAuth, (req, res) => {
    const user = req.user!;
    sendOk(res, {
      user,
      organizations: [
        {
          id: SEED_ORG_ICI_ID,
          code: 'ICI',
          name: 'ICI',
          active: true,
        },
      ],
      membership: {
        organizationId: SEED_ORG_ICI_ID,
        userId: user.id,
        role: isAdminLike(user) ? 'ADMIN' : 'SCHEDULE_MANAGER',
      },
      authorization: {
        userId: user.id,
        organizationId: SEED_ORG_ICI_ID,
        sectorIds: user.authorizedSectorIds,
        teamIds: user.authorizedTeamIds,
      },
    });
  });

  router.get('/areas', requireAuth, (req, res) => {
    const user = req.user!;
    sendOk(res, AREAS.filter((area) => area.active && canAccessArea(user, area.id)));
  });

  router.get('/areas/:areaId/teams', requireAuth, (req, res, next) => {
    const user = req.user!;
    const area = AREAS.find((candidate) => candidate.id === req.params.areaId);
    if (!area) {
      next(new AppError('AREA_NOT_FOUND', 'Área não encontrada.', 404));
      return;
    }
    if (!canAccessArea(user, area.id)) {
      next(new AppError('AREA_FORBIDDEN', 'Usuário não autorizado para esta área.', 403));
      return;
    }
    sendOk(
      res,
      TEAMS.filter((team) => team.areaId === area.id && team.active && canAccessTeam(user, team.id)),
    );
  });

  router.get('/teams/:teamId', requireAuth, (req, res, next) => {
    const user = req.user!;
    const team = TEAMS.find((candidate) => candidate.id === req.params.teamId);
    if (!team) {
      next(new AppError('TEAM_NOT_FOUND', 'Equipe não encontrada.', 404));
      return;
    }
    if (!canAccessTeam(user, team.id)) {
      next(new AppError('TEAM_FORBIDDEN', 'Usuário não autorizado para esta equipe.', 403));
      return;
    }
    sendOk(res, team);
  });

  return router;
}
