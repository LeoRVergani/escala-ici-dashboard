import { createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { validateSchedule } from '../../src/features/editor/validateSchedule.js';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
import { getActiveRevision, publishRevision } from '../application/publicationStore.js';
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

const memberSchema = z.object({
  id: z.string().min(1),
  teamId: z.string().min(1),
  name: z.string().min(1),
  corporateLogin: z.string().min(1),
  email: z.string().optional(),
  active: z.boolean(),
});

const publishSchema = z.object({
  schedule: scheduleSchema,
  members: z.array(memberSchema),
  expectedActiveRevision: z.number().int().nonnegative(),
  idempotencyKey: z.string().min(12),
  sourceHash: z.string().min(1),
  packageHash: z.string().min(1),
  confirmation: z.literal(true),
  reason: z.string().optional(),
});

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createPublicationRoutes(config: AppConfig) {
  const router = Router();

  router.post('/teams/:teamId/schedules/publish', requireAuth, validateBody(publishSchema), (req, res, next) => {
    try {
      const team = TEAMS.find((candidate) => candidate.id === req.params.teamId);
      if (!team) {
        next(new AppError('TEAM_NOT_FOUND', 'Equipe não encontrada.', 404));
        return;
      }
      if (!req.user || !canAccessTeam(req.user, team.id)) {
        next(new AppError('TEAM_FORBIDDEN', 'Usuário não autorizado para esta equipe.', 403));
        return;
      }
      if (req.body.schedule.teamId !== team.id) {
        next(new AppError('PUBLICATION_TEAM_MISMATCH', 'Escala não pertence à equipe solicitada.', 400));
        return;
      }

      const validation = validateSchedule(req.body.schedule, req.body.members);
      if (validation.errors.length > 0) {
        next(new AppError('PUBLICATION_PACKAGE_INVALID', 'Pacote possui erros impeditivos.', 422, validation.errors));
        return;
      }

      const normalizedPackageHash = sha256(
        stableStringify({
          schedule: req.body.schedule,
          members: req.body.members,
          sourceHash: req.body.sourceHash,
        }),
      );

      if (!config.ALLOW_OFFICIAL_FIRESTORE_WRITE) {
        sendOk(res, {
          status: 'official-write-disabled',
          writable: false,
          validated: true,
          activeRevision: getActiveRevision(team.id),
          expectedActiveRevision: req.body.expectedActiveRevision,
          normalizedPackageHash,
          message: 'Escrita oficial no Firestore está desabilitada por configuração.',
        });
        return;
      }

      const record = publishRevision({
        workspaceId: config.OFFICIAL_WORKSPACE_ID,
        teamId: team.id,
        schedule: req.body.schedule,
        members: req.body.members,
        expectedActiveRevision: req.body.expectedActiveRevision,
        idempotencyKey: req.body.idempotencyKey,
        sourceHash: req.body.sourceHash,
        packageHash: req.body.packageHash,
        reason: req.body.reason,
        user: req.user!,
      });
      sendOk(res, {
        status: 'published',
        writable: true,
        revision: record.revision,
        activeRevision: record.revision,
        previousRevision: record.previousRevision,
        normalizedPackageHash,
        record,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
