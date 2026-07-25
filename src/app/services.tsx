import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AuthGateway } from '@/services/AuthGateway';
import { DevAuthGateway } from '@/services/DevAuthGateway';
import type { OrganizationRepository } from '@/services/OrganizationRepository';
import { LocalOrganizationRepository } from '@/services/LocalOrganizationRepository';
import type { ScheduleRepository } from '@/services/ScheduleRepository';
import { LocalScheduleRepository } from '@/services/LocalScheduleRepository';

interface Services {
  authGateway: AuthGateway;
  organizationRepository: OrganizationRepository;
  scheduleRepository: ScheduleRepository;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<Services>(
    () => ({
      authGateway: new DevAuthGateway(),
      organizationRepository: new LocalOrganizationRepository(),
      scheduleRepository: new LocalScheduleRepository(),
    }),
    [],
  );
  return (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
  );
}

function useServices(): Services {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error('useServices must be used within a ServicesProvider');
  return ctx;
}

export function useAuthGateway(): AuthGateway {
  return useServices().authGateway;
}

export function useOrganizationRepository(): OrganizationRepository {
  return useServices().organizationRepository;
}

export function useScheduleRepository(): ScheduleRepository {
  return useServices().scheduleRepository;
}
