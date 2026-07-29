import { createHash } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { validateSchedule } from '../../src/features/editor/validateSchedule.js';
import type { AlertSeverity, ScheduleWarning } from '../../src/features/editor/validateSchedule.js';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
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

const validateScheduleSchema = z.object({
  schedule: scheduleSchema,
  members: z.array(memberSchema),
  expectedActiveRevision: z.number().int().nonnegative().optional(),
  sourceHash: z.string().optional(),
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

function titleFor(ruleCode: ScheduleWarning['ruleCode']): string {
  const titles: Record<ScheduleWarning['ruleCode'], string> = {
    duplicateMember: 'Colaborador duplicado',
    singleVacationDay: 'Férias isoladas',
    sixByOne: 'Regra 6x1',
    restHours: 'Descanso mínimo',
    onCallGap: 'Cobertura de plantão',
  };
  return titles[ruleCode];
}

function toAlert(warning: ScheduleWarning) {
  return {
    id: sha256(warning.dedupKey).slice(0, 16),
    dedupKey: warning.dedupKey,
    ruleCode: warning.ruleCode,
    severity: warning.severity,
    title: titleFor(warning.ruleCode),
    message: warning.message,
    memberId: warning.memberId,
    date: warning.date,
    metadata: {
      source: 'dashboard-validateSchedule',
    },
  };
}

function splitBySeverity(warnings: ScheduleWarning[], severity: AlertSeverity) {
  return warnings.filter((warning) => warning.severity === severity).map(toAlert);
}

export function createValidationRoutes() {
  const router = Router();

  router.post('/teams/:teamId/schedules/validate', requireAuth, validateBody(validateScheduleSchema), (req, res, next) => {
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
        next(new AppError('VALIDATION_TEAM_MISMATCH', 'Escala não pertence à equipe solicitada.', 400));
        return;
      }

      const validation = validateSchedule(req.body.schedule, req.body.members);
      const blockingErrors = validation.errors.map((message, index) => ({
        id: sha256(`blocking|${index}|${message}`).slice(0, 16),
        dedupKey: `blocking|${message}`,
        ruleCode: 'blockingValidation',
        severity: 'critico',
        title: 'Erro impeditivo',
        message,
        memberId: '',
        metadata: {
          source: 'dashboard-validateSchedule',
        },
      }));
      const normalizedPackageHash = sha256(
        stableStringify({
          schedule: req.body.schedule,
          members: req.body.members,
          sourceHash: req.body.sourceHash,
        }),
      );

      sendOk(res, {
        valid: blockingErrors.length === 0,
        blockingErrors,
        warnings: splitBySeverity(validation.warnings, 'atencao'),
        infos: splitBySeverity(validation.warnings, 'info'),
        criticalWarnings: splitBySeverity(validation.warnings, 'critico'),
        normalizedPackageHash,
        counts: {
          members: req.body.members.length,
          assignments: req.body.schedule.assignments.length,
          blockingErrors: blockingErrors.length,
          warnings: validation.warnings.filter((warning) => warning.severity !== 'info').length,
          infos: validation.warnings.filter((warning) => warning.severity === 'info').length,
        },
        expectedActiveRevision: req.body.expectedActiveRevision,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
