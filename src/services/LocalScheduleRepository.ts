import type { Schedule } from '@/domain/schedule';
import { localStore } from './storage/localStore';
import type { ScheduleRepository } from './ScheduleRepository';

export class LocalScheduleRepository implements ScheduleRepository {
  async listByTeam(teamId: string): Promise<Schedule[]> {
    return localStore.read().schedules.filter((s) => s.teamId === teamId);
  }

  async getById(scheduleId: string): Promise<Schedule | null> {
    return localStore.read().schedules.find((s) => s.id === scheduleId) ?? null;
  }

  async getDraftByTeam(teamId: string): Promise<Schedule | null> {
    return (
      localStore
        .read()
        .schedules.find((s) => s.teamId === teamId && s.status === 'DRAFT') ??
      null
    );
  }

  async getPublishedByTeam(teamId: string): Promise<Schedule | null> {
    return (
      localStore
        .read()
        .schedules.find(
          (s) => s.teamId === teamId && s.status === 'PUBLISHED',
        ) ?? null
    );
  }

  async create(schedule: Schedule): Promise<Schedule> {
    const store = localStore.read();
    store.schedules.push(schedule);
    localStore.write(store);
    return schedule;
  }

  async save(schedule: Schedule): Promise<Schedule> {
    const store = localStore.read();
    const index = store.schedules.findIndex((s) => s.id === schedule.id);
    const updated: Schedule = { ...schedule, updatedAt: new Date().toISOString() };
    if (index === -1) {
      store.schedules.push(updated);
    } else {
      store.schedules[index] = updated;
    }
    localStore.write(store);
    return updated;
  }

  async publish(scheduleId: string): Promise<Schedule> {
    const store = localStore.read();
    const schedule = store.schedules.find((s) => s.id === scheduleId);
    if (!schedule) throw new Error(`Schedule not found: ${scheduleId}`);
    schedule.status = 'PUBLISHED';
    schedule.updatedAt = new Date().toISOString();
    localStore.write(store);
    return schedule;
  }
}
