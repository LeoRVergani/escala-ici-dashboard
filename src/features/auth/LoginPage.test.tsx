import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { ServicesProvider } from '@/app/services';
import { AuthProvider } from '@/app/auth';
import { ToastProvider } from '@/components/AppToast';

function renderLoginPage() {
  return render(
    <ServicesProvider>
      <ToastProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </ToastProvider>
    </ServicesProvider>,
  );
}

describe('LoginPage (checkpoint 1A — reprodução da tela Órbita)', () => {
  afterEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/login');
  });

  it('shows the brand and the corporate-access protection badge in the header', () => {
    renderLoginPage();
    expect(screen.getByText('ESCALA ICI')).toBeInTheDocument();
    expect(screen.getByText('Acesso corporativo protegido')).toBeInTheDocument();
  });

  it('shows the full two-line hero title', () => {
    renderLoginPage();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent?.replace(/\s+/g, ' ').trim()).toBe('Gestão de escalas, sem desvios.');
  });

  it('shows a configuration notice when Microsoft sign-in is clicked, without starting a session', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByText('Entrar com Microsoft'));

    expect(
      await screen.findByText('A integração Microsoft ainda não está configurada neste ambiente local.'),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem('escala-ici:dev-session')).toBeNull();
    expect(window.location.pathname).toBe('/login');
  });

  it('shows the local test environment entry directly', () => {
    renderLoginPage();

    expect(screen.getByText('Ambiente de teste')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no ambiente de teste/ })).toBeEnabled();
  });

  it('signs in through the local dev environment and navigates to /organizacoes', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /Entrar no ambiente de teste/ }));

    await waitFor(() => expect(window.location.pathname).toBe('/organizacoes'));
    expect(sessionStorage.getItem('escala-ici:dev-session')).not.toBeNull();
  });

  it('reaches every interactive control via keyboard alone', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.tab();
    expect(screen.getByText('Entrar com Microsoft').closest('button')).toHaveFocus();

    await user.tab();
    expect(screen.getByText('Entrar no ambiente de teste').closest('button')).toHaveFocus();
  });

  it('marks the flow steps and the context graphic as non-interactive decoration', () => {
    renderLoginPage();
    expect(screen.getByText('01').closest('ol')).toBeInTheDocument();
    for (const el of screen.getAllByText('COSI')) {
      expect(el.closest('[aria-hidden="true"]')).toBeTruthy();
    }
  });
});
