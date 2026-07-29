import multer from 'multer';
import { Router } from 'express';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../domain/appError.js';
import { TEAMS, canAccessTeam } from '../domain/organizationSeed.js';
import {
  buildImportPreview,
  extensionOf,
  hasValidSpreadsheetSignature,
  sanitizeFileName,
} from '../application/importPreview.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendOk } from '../app/responses.js';

export function createImportRoutes(config: AppConfig) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: config.IMPORT_MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  });

  router.post('/imports/preview', requireAuth, upload.single('file'), (req, res, next) => {
    try {
      const file = req.file;
      const teamId = typeof req.body.teamId === 'string' ? req.body.teamId : '';
      const optionKey = typeof req.body.optionKey === 'string' ? req.body.optionKey : undefined;
      if (!file) {
        next(new AppError('IMPORT_FILE_MISSING', 'Arquivo XLS/XLSX ausente.', 400));
        return;
      }
      const team = TEAMS.find((candidate) => candidate.id === teamId);
      if (!team) {
        next(new AppError('TEAM_NOT_FOUND', 'Equipe não encontrada.', 404));
        return;
      }
      if (!req.user || !canAccessTeam(req.user, team.id)) {
        next(new AppError('TEAM_FORBIDDEN', 'Usuário não autorizado para esta equipe.', 403));
        return;
      }
      const fileName = sanitizeFileName(file.originalname);
      const extension = extensionOf(fileName);
      if (extension !== 'xls' && extension !== 'xlsx') {
        next(new AppError('IMPORT_EXTENSION_INVALID', 'Formato inválido. Use XLS ou XLSX.', 400));
        return;
      }
      if (!hasValidSpreadsheetSignature(file.buffer, extension)) {
        next(new AppError('IMPORT_SIGNATURE_INVALID', 'Conteúdo do arquivo não corresponde ao formato informado.', 400));
        return;
      }

      const preview = buildImportPreview({
        buffer: file.buffer,
        fileName,
        teamId: team.id,
        teamName: team.name,
        scheduleType: team.scheduleType,
        optionKey,
      });
      sendOk(res, preview);
    } catch (error) {
      next(new AppError('IMPORT_PREVIEW_FAILED', error instanceof Error ? error.message : 'Falha ao importar arquivo.', 422));
    }
  });

  return router;
}
