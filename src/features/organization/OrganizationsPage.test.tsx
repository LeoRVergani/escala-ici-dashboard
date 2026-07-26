import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizationsPage } from './OrganizationsPage';
import { ServicesProvider } from '@/app/services';
import { AuthProvider, useAuth } from '@/app/auth';
import { ToastProvider } from '@/components/AppToast';
import { useEffect } from 'react';

function SignedInAsClaudio({ children }: { children: React.ReactNode }) {
  const { signIn, user } = useAuth();
  useEffect(() => {
    if (!user) void signIn();
  }, [signIn, user]);
  if (!user) return null;
  return <>{children}</>;
}

function renderOrganizationsPage() {
  return render(
    <ServicesProvider>
      <ToastProvider>
        <AuthProvider>
          <SignedInAsClaudio>
            <OrganizationsPage />
          </SignedInAsClaudio>
        </AuthProvider>
      </ToastProvider>
    </ServicesProvider>,
  );
}

describe('OrganizationsPage (checkpoint 1B — painel de organizações)', () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    window.history.replaceState({}, '', '/organizacoes');
  });

  it('renders the shell with the sidebar active on Minhas organizações and the topbar context', async () => {
    renderOrganizationsPage();
    await screen.findByText('ICI');

    expect(screen.getByRole('link', { name: 'Minhas organizações' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Contexto atual')).toBeInTheDocument();
    expect(screen.getByText('Todas as organizações autorizadas')).toBeInTheDocument();
  });

  it('shows the ICI organization summary card without exposing createdBy authorship', async () => {
    renderOrganizationsPage();
    const summaryHeading = await screen.findByRole('heading', { name: 'ICI', level: 2 });
    const summaryCard = summaryHeading.closest('[data-organization-summary-id]') as HTMLElement;

    expect(within(summaryCard).getByText('Instituto das Cidades Inteligentes')).toBeInTheDocument();
    expect(within(summaryCard).queryByText(/Criado por/i)).not.toBeInTheDocument();
    expect(within(summaryCard).queryByText('Claudio')).not.toBeInTheDocument();
  });

  it('lists ICI as a wide row with role, authorized sector count, and an Abrir organização action — never "Proprietário"', async () => {
    renderOrganizationsPage();
    const row = await screen.findByText('Abrir organização');
    const listItem = row.closest('[data-organization-id]') as HTMLElement;

    expect(within(listItem).getByText(/Administrador/)).toBeInTheDocument();
    expect(within(listItem).getByText(/1 setor autorizado/)).toBeInTheDocument();
    expect(screen.queryByText(/Proprietário/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OWNER/i)).not.toBeInTheDocument();
  });

  it('"Abrir organização" navigates to /setores', async () => {
    const user = userEvent.setup();
    renderOrganizationsPage();
    await user.click(await screen.findByText('Abrir organização'));
    await waitFor(() => expect(window.location.pathname).toBe('/setores'));
  });

  it('creates an organization with ADMIN role for the creator and no OWNER role anywhere', async () => {
    const user = userEvent.setup();
    renderOrganizationsPage();

    await user.click(await screen.findByText('Criar organização'));
    await user.type(screen.getByLabelText('Nome'), 'Nova Organização');
    await user.type(screen.getByLabelText('Código'), 'NOVA');
    await user.click(screen.getByRole('button', { name: 'Criar' }));

    await screen.findByRole('heading', { name: 'Nova Organização' });
    const rows = await screen.findAllByText('Abrir organização');
    expect(rows.length).toBe(2);

    const novaRow = screen.getByText('NOVA').closest('[data-organization-id]') as HTMLElement;
    expect(within(novaRow).getByText(/Administrador/)).toBeInTheDocument();
    expect(screen.queryByText(/Proprietário|OWNER/i)).not.toBeInTheDocument();
  });

  it('offers a dev-only identity switcher that signs in as wmoriyama', async () => {
    const user = userEvent.setup();
    renderOrganizationsPage();
    await screen.findByText('ICI');

    await user.click(screen.getByRole('button', { name: /Claudio/ }));
    await user.click(screen.getByRole('menuitem', { name: /wmoriyama/ }));

    await waitFor(() => expect(window.location.pathname).toBe('/organizacoes'));
    // wmoriyama is SCHEDULE_MANAGER in ICI, never ADMIN — the role label must reflect that switch.
    await screen.findAllByText('Gestor de escalas');
  });
});
