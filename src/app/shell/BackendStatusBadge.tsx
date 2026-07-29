import { useEffect, useState } from 'react';
import { AppBadge } from '@/components/AppBadge';
import { BackendOfflineError } from '@/services/http/HttpApiClient';
import { useApiClient } from '../services';

interface HealthData {
  status: string;
}

type BackendStatus = 'hidden' | 'checking' | 'online' | 'offline';

export function BackendStatusBadge() {
  const apiClient = useApiClient();
  const [status, setStatus] = useState<BackendStatus>(apiClient ? 'checking' : 'hidden');

  useEffect(() => {
    let cancelled = false;
    if (!apiClient) {
      setStatus('hidden');
      return;
    }

    setStatus('checking');
    apiClient
      .get<HealthData>('/api/health')
      .then((health) => {
        if (!cancelled) setStatus(health.status === 'ok' ? 'online' : 'offline');
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus(error instanceof BackendOfflineError ? 'offline' : 'offline');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  if (status === 'hidden') return null;
  if (status === 'checking') return <AppBadge tone="neutral">Conectando</AppBadge>;
  if (status === 'online') return <AppBadge tone="success">Online</AppBadge>;
  return <AppBadge tone="warning">Offline</AppBadge>;
}
