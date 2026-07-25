import { Switch, Route } from 'wouter';
import { ServicesProvider } from './services';
import { AuthProvider } from './auth';
import { RequireAuth } from './RequireAuth';
import { ToastProvider } from '@/components/AppToast';
import { LoginPage } from '@/features/auth/LoginPage';
import { SectorsPage } from '@/features/organization/SectorsPage';
import { TeamsPage } from '@/features/organization/TeamsPage';
import { SchedulesPage } from '@/features/schedules/SchedulesPage';
import { NewSchedulePage } from '@/features/schedules/NewSchedulePage';
import { ScheduleEditorPage } from '@/features/editor/ScheduleEditorPage';
import { DesignSystemShowcasePage } from '@/features/dev/DesignSystemShowcasePage';

export function App() {
  return (
    <ServicesProvider>
      <ToastProvider>
        <AuthProvider>
          <Switch>
            <Route path="/login" component={LoginPage} />
            {import.meta.env.DEV && (
              <Route path="/dev/design-system" component={DesignSystemShowcasePage} />
            )}
            <Route path="/setores">
              <RequireAuth>
                <SectorsPage />
              </RequireAuth>
            </Route>
            <Route path="/setores/:sectorId/equipes">
              <RequireAuth>
                <TeamsPage />
              </RequireAuth>
            </Route>
            <Route path="/equipes/:teamId/escalas/nova">
              <RequireAuth>
                <NewSchedulePage />
              </RequireAuth>
            </Route>
            <Route path="/equipes/:teamId/escalas">
              <RequireAuth>
                <SchedulesPage />
              </RequireAuth>
            </Route>
            <Route path="/escalas/:scheduleId">
              <RequireAuth>
                <ScheduleEditorPage />
              </RequireAuth>
            </Route>
            <Route>
              <RequireAuth>
                <SectorsPage />
              </RequireAuth>
            </Route>
          </Switch>
        </AuthProvider>
      </ToastProvider>
    </ServicesProvider>
  );
}
