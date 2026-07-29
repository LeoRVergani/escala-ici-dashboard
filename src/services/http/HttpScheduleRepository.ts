import type { Schedule } from '@/domain/schedule';
import type { ScheduleRepository } from '../ScheduleRepository';

export class HttpScheduleRepository implements ScheduleRepository {
  async listByTeam(_teamId: string): Promise<Schedule[]> {
    return [];
  }

  async getById(_scheduleId: string): Promise<Schedule | null> {
    return null;
  }

  async getDraftByTeam(_teamId: string): Promise<Schedule | null> {
    return null;
  }

  async getPublishedByTeam(_teamId: string): Promise<Schedule | null> {
    return null;
  }

  async create(schedule: Schedule): Promise<Schedule> {
    return schedule;
  }

  async save(schedule: Schedule): Promise<Schedule> {
    return schedule;
  }

  async publish(scheduleId: string): Promise<Schedule> {
    throw new Error(`Publicação via API entra no checkpoint Firebase: ${scheduleId}`);
  }
}
