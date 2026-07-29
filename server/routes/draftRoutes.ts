import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
import { deleteCurrentDraft, getCurrentDraft, saveCurrentDraft } from '../application/draftStore.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { sendOk } from '../app/responses.js';

const shiftCodeSchema = z.enum([
  'madrugada',
  'manha',
  'tarde',
  'noite',
  'folga',
  'ferias',
  'plantao',
  'comercial',
  'extra',
  'afastamento',
  'custom',
]);

const scheduleSchema = z.object({
  id: z.string().min(1),
  sectorId: z.string().min(1),
  teamId: z.string().min(1),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  members: z.array(z.string()),
  assignments: z.array(
    z.object({
      scheduleId: z.string().min(1),
      memberId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      shiftCode: shiftCodeSchema,
      note: z.string().optional(),
    }),
  ),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

const saveDraftSchema = z.object({
  schedule: scheduleSchema,
  sourceHash: z.string().optional(),
  expectedActiveRevision: z.number().int().nonnegative().optional(),
});

function ensureTeamAccess(teamId: string, user: Express.Request['user']) {
  const team = TEAMS.find((candidate) => candidate.id === teamId);
  if (!team) throw new AppError('TEAM_NOT_FOUND', 'Equipe não encontrada.', 404);
  if (!user || !canAccessTeam(user, team.id)) {
    throw new AppError('TEAM_FORBIDDEN', 'Usuário não autorizado para esta equipe.', 403);
  }
  return team;
}

function paramValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function createDraftRoutes() {
  const router = Router();

  router.get('/teams/:teamId/drafts/current', requireAuth, (req, res, next) => {
    try {
      const teamId = paramValue(req.params.teamId);
      ensureTeamAccess(teamId, req.user);
      sendOk(res, getCurrentDraft(teamId));
    } catch (error) {
      next(error);
    }
  });

  router.put('/teams/:teamId/drafts/current', requireAuth, validateBody(saveDraftSchema), (req, res, next) => {
    try {
      const team = ensureTeamAccess(paramValue(req.params.teamId), req.user);
      if (req.body.schedule.teamId !== team.id) {
        next(new AppError('DRAFT_TEAM_MISMATCH', 'Rascunho não pertence à equipe solicitada.', 400));
        return;
      }
      const record = saveCurrentDraft({
        teamId: team.id,
        schedule: req.body.schedule,
        sourceHash: req.body.sourceHash,
        expectedActiveRevision: req.body.expectedActiveRevision,
        user: req.user!,
      });
      sendOk(res, record);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/teams/:teamId/drafts/current', requireAuth, (req, res, next) => {
    try {
      const teamId = paramValue(req.params.teamId);
      ensureTeamAccess(teamId, req.user);
      sendOk(res, { deleted: deleteCurrentDraft(teamId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
