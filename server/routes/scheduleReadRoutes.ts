import * as XLSX from 'xlsx';
import { Router } from 'express';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
import { getActiveRevision, getPublicationRecord, listPublicationHistory } from '../application/publicationStore.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendOk } from '../app/responses.js';

function ensureTeam(teamId: string, user: Express.Request['user']) {
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

function toHistorySummary(record: NonNullable<ReturnType<typeof getPublicationRecord>>) {
  return {
    teamId: record.teamId,
    periodId: record.periodId,
    revision: record.revision,
    previousRevision: record.previousRevision,
    status: record.status,
    sourceHash: record.sourceHash,
    packageHash: record.packageHash,
    counts: record.counts,
    publishedAt: record.publishedAt,
    publishedBy: record.publishedBy,
    activatedAt: record.activatedAt,
    schemaVersion: record.schemaVersion,
  };
}

function buildWorkbook(record: NonNullable<ReturnType<typeof getPublicationRecord>>): Buffer {
  const memberById = new Map(record.members.map((member) => [member.id, member]));
  const rows = record.schedule.assignments.map((assignment) => {
    const member = memberById.get(assignment.memberId);
    return {
      revision: record.revision,
      teamId: record.teamId,
      periodStart: record.schedule.periodStart,
      periodEnd: record.schedule.periodEnd,
      memberId: assignment.memberId,
      corporateLogin: member?.corporateLogin ?? '',
      name: member?.name ?? '',
      date: assignment.date,
      shiftCode: assignment.shiftCode,
      note: assignment.note ?? '',
    };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Escala');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      {
        revision: record.revision,
        teamId: record.teamId,
        periodStart: record.schedule.periodStart,
        periodEnd: record.schedule.periodEnd,
        members: record.counts.members,
        assignments: record.counts.assignments,
        publishedAt: record.publishedAt,
        publishedBy: record.publishedBy.login,
      },
    ]),
    'Resumo',
  );
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer);
}

export function createScheduleReadRoutes() {
  const router = Router();

  router.get('/teams/:teamId/publication-status', requireAuth, (req, res, next) => {
    try {
      const team = ensureTeam(paramValue(req.params.teamId), req.user);
      const activeRevision = getActiveRevision(team.id);
      sendOk(res, {
        teamId: team.id,
        activeRevision,
        hasActivePublication: activeRevision > 0,
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/teams/:teamId/schedules/current', requireAuth, (req, res, next) => {
    try {
      const team = ensureTeam(paramValue(req.params.teamId), req.user);
      const activeRevision = getActiveRevision(team.id);
      const record = activeRevision > 0 ? getPublicationRecord(team.id, activeRevision) : null;
      sendOk(res, record);
    } catch (error) {
      next(error);
    }
  });

  router.get('/teams/:teamId/schedules/history', requireAuth, (req, res, next) => {
    try {
      const team = ensureTeam(paramValue(req.params.teamId), req.user);
      sendOk(res, listPublicationHistory(team.id).map(toHistorySummary));
    } catch (error) {
      next(error);
    }
  });

  router.get('/teams/:teamId/schedules/:revision/export.xlsx', requireAuth, (req, res, next) => {
    try {
      const team = ensureTeam(paramValue(req.params.teamId), req.user);
      const revision = Number(req.params.revision);
      const record = Number.isInteger(revision) ? getPublicationRecord(team.id, revision) : null;
      if (!record) {
        next(new AppError('REVISION_NOT_FOUND', 'Revisão não encontrada.', 404));
        return;
      }
      const workbook = buildWorkbook(record);
      res.setHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('content-disposition', `attachment; filename="escala-${team.code}-rev-${revision}.xlsx"`);
      res.send(workbook);
    } catch (error) {
      next(error);
    }
  });

  router.get('/teams/:teamId/schedules/:revision', requireAuth, (req, res, next) => {
    try {
      const team = ensureTeam(paramValue(req.params.teamId), req.user);
      const revision = Number(req.params.revision);
      const record = Number.isInteger(revision) ? getPublicationRecord(team.id, revision) : null;
      if (!record) {
        next(new AppError('REVISION_NOT_FOUND', 'Revisão não encontrada.', 404));
        return;
      }
      sendOk(res, record);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
