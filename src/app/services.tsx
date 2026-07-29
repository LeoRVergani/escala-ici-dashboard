import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AuthGateway } from '@/services/AuthGateway';
import { DevAuthGateway } from '@/services/DevAuthGateway';
import type { OrganizationRepository } from '@/services/OrganizationRepository';
import { LocalOrganizationRepository } from '@/services/LocalOrganizationRepository';
import type { ScheduleRepository } from '@/services/ScheduleRepository';
import { LocalScheduleRepository } from '@/services/LocalScheduleRepository';
import { HttpApiClient } from '@/services/http/HttpApiClient';
import { HttpAuthGateway } from '@/services/http/HttpAuthGateway';
import { HttpOrganizationRepository } from '@/services/http/HttpOrganizationRepository';
import { HttpScheduleRepository } from '@/services/http/HttpScheduleRepository';

interface Services {
  authGateway: AuthGateway;
  organizationRepository: OrganizationRepository;
  scheduleRepository: ScheduleRepository;
  apiClient: HttpApiClient | null;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<Services>(
    () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
      const useLocalAdapters = import.meta.env.VITE_USE_LOCAL_ADAPTERS !== 'false';
      const apiClient = apiBaseUrl ? new HttpApiClient({ baseUrl: apiBaseUrl }) : null;

      if (apiClient && !useLocalAdapters) {
        return {
          authGateway: new HttpAuthGateway(apiClient),
          organizationRepository: new HttpOrganizationRepository(apiClient),
          scheduleRepository: new HttpScheduleRepository(),
          apiClient,
        };
      }

      return {
        authGateway: new DevAuthGateway(),
        organizationRepository: new LocalOrganizationRepository(),
        scheduleRepository: new LocalScheduleRepository(),
        apiClient: null,
      };
    },
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

export function useApiClient(): HttpApiClient | null {
  return useServices().apiClient;
}
