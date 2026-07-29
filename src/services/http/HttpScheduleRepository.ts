import type { Schedule } from '@/domain/schedule';
import type { ScheduleRepository } from '../ScheduleRepository';
import type { HttpApiClient } from './HttpApiClient';

export class HttpScheduleRepository implements ScheduleRepository {
  private readonly apiClient: HttpApiClient;

  constructor(apiClient: HttpApiClient) {
    this.apiClient = apiClient;
  }

  async listByTeam(_teamId: string): Promise<Schedule[]> {
    const draft = await this.getDraftByTeam(_teamId);
    return draft ? [draft] : [];
  }

  async getById(_scheduleId: string): Promise<Schedule | null> {
    return null;
  }

  async getDraftByTeam(teamId: string): Promise<Schedule | null> {
    const draft = await this.apiClient.get<{ schedule: Schedule } | null>(`/api/teams/${teamId}/drafts/current`);
    return draft?.schedule ?? null;
  }

  async getPublishedByTeam(_teamId: string): Promise<Schedule | null> {
    return null;
  }

  async create(schedule: Schedule): Promise<Schedule> {
    const draft = await this.apiClient.put<{ schedule: Schedule }>(
      `/api/teams/${schedule.teamId}/drafts/current`,
      { schedule },
    );
    return draft.schedule;
  }

  async save(schedule: Schedule): Promise<Schedule> {
    const draft = await this.apiClient.put<{ schedule: Schedule }>(
      `/api/teams/${schedule.teamId}/drafts/current`,
      { schedule },
    );
    return draft.schedule;
  }

  async publish(scheduleId: string): Promise<Schedule> {
    throw new Error(`Publicação via API entra no checkpoint Firebase: ${scheduleId}`);
  }
}
