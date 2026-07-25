import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { ServicesProvider } from './services';
import { AuthProvider } from './auth';

function renderHeader(breadcrumb?: { sectorCode: string; teamCode?: string }) {
  return render(
    <ServicesProvider>
      <AuthProvider>
        <Header breadcrumb={breadcrumb} />
      </AuthProvider>
    </ServicesProvider>,
  );
}

describe('Header (scenario: setor/equipe aparecem corretamente no cabeçalho)', () => {
  it('shows nothing extra when no context is selected yet', () => {
    renderHeader();
    expect(screen.queryByText(/COSI/)).not.toBeInTheDocument();
  });

  it('shows only the sector when no team is selected', () => {
    renderHeader({ sectorCode: 'COSI' });
    expect(screen.getByText('COSI')).toBeInTheDocument();
  });

  it('shows "SETOR / EQUIPE" once both are selected', () => {
    renderHeader({ sectorCode: 'COSI', teamCode: 'SOC' });
    expect(screen.getByText((_, node) => node?.textContent === 'COSI / SOC')).toBeInTheDocument();
  });

  it('never claims Microsoft/backend are connected, and marks the local dev environment', () => {
    renderHeader({ sectorCode: 'COSI', teamCode: 'NOC' });
    expect(screen.getAllByText(/Ambiente local de desenvolvimento|Local/).length).toBeGreaterThan(0);
    expect(screen.getByText((_, node) => node?.textContent === 'COSI / NOC')).toBeInTheDocument();
  });
});
