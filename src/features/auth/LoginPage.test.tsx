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

  it('keeps the local simulation entry hidden until the test environment menu opens', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const trigger = screen.getByRole('button', { name: /Ambiente de teste/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /Simulação/ })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Simulação/ })).toBeEnabled();
  });

  it('signs in through the local dev environment and navigates to /organizacoes', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /Ambiente de teste/ }));
    await user.click(screen.getByRole('button', { name: /Simulação/ }));

    await waitFor(() => expect(window.location.pathname).toBe('/organizacoes'));
    expect(sessionStorage.getItem('escala-ici:dev-session')).not.toBeNull();
  });

  it('reaches every interactive control via keyboard alone', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.tab();
    expect(screen.getByText('Entrar com Microsoft').closest('button')).toHaveFocus();

    await user.tab();
    const trigger = screen.getByRole('button', { name: /Ambiente de teste/ });
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.tab();
    expect(screen.getByText('Simulação').closest('button')).toHaveFocus();
  });

  it('marks the flow steps and the context graphic as non-interactive decoration', () => {
    renderLoginPage();
    expect(screen.getByText('01').closest('ol')).toBeInTheDocument();
    for (const el of screen.getAllByText('COSI')) {
      expect(el.closest('[aria-hidden="true"]')).toBeTruthy();
    }
  });
});
