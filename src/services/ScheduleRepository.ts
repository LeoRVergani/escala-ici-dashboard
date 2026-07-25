import type { Schedule } from '@/domain/schedule';

export interface ScheduleRepository {
  listByTeam(teamId: string): Promise<Schedule[]>;
  getById(scheduleId: string): Promise<Schedule | null>;
  getDraftByTeam(teamId: string): Promise<Schedule | null>;
  getPublishedByTeam(teamId: string): Promise<Schedule | null>;
  create(schedule: Schedule): Promise<Schedule>;
  save(schedule: Schedule): Promise<Schedule>;
  publish(scheduleId: string): Promise<Schedule>;
}
