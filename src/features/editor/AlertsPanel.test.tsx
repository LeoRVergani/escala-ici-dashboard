import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Member } from '@/domain/member';
import { AlertsPanel } from './AlertsPanel';
import type { ScheduleWarning } from './validateSchedule';

const MEMBERS: Member[] = [
  { id: 'ana', teamId: 'team-1', name: 'Ana Silva', corporateLogin: 'ana.silva', active: true },
  { id: 'bia', teamId: 'team-1', name: 'Bia Costa', corporateLogin: 'bia.costa', active: true },
];

function warning(overrides: Partial<ScheduleWarning>): ScheduleWarning {
  return {
    memberId: 'ana',
    message: 'Mensagem do alerta',
    severity: 'atencao',
    ruleCode: 'singleVacationDay',
    date: '2026-07-02',
    dedupKey: `${overrides.memberId ?? 'ana'}|${overrides.ruleCode ?? 'singleVacationDay'}|${overrides.date ?? '2026-07-02'}`,
    ...overrides,
  };
}

function renderPanel({
  errors = [],
  warnings = [],
  onNavigateToAlert = vi.fn(),
}: {
  errors?: string[];
  warnings?: ScheduleWarning[];
  onNavigateToAlert?: (memberId: string, date?: string) => void;
} = {}) {
  const result = render(
    <AlertsPanel
      open
      onClose={vi.fn()}
      errors={errors}
      warnings={warnings}
      members={MEMBERS}
      onNavigateToAlert={onNavigateToAlert}
    />,
  );

  return { ...result, onNavigateToAlert };
}

describe('AlertsPanel', () => {
  it('renderiza as três seções quando há erros, alertas e informações', () => {
    renderPanel({
      errors: ['A escala não possui colaboradores.'],
      warnings: [
        warning({ severity: 'critico', ruleCode: 'sixByOne', message: 'Ana com 7 dias seguidos sem folga' }),
        warning({
          memberId: 'bia',
          severity: 'atencao',
          ruleCode: 'duplicateMember',
          date: undefined,
          message: '"Bia Costa" aparece mais de uma vez na lista de colaboradores.',
        }),
        warning({
          severity: 'info',
          ruleCode: 'sixByOne',
          date: undefined,
          message: 'Ana: regra 6x1 dentro do limite.',
        }),
      ],
    });

    expect(screen.getByRole('heading', { name: 'Erros impeditivos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alertas' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Informações' })).toBeInTheDocument();
    expect(screen.getByText('A escala não possui colaboradores.')).toBeInTheDocument();
    expect(screen.getByText('Colaborador duplicado')).toBeInTheDocument();
    expect(screen.getAllByText('Regra 6x1')).toHaveLength(2);
  });

  it('mostra o botão "Ir para" apenas em warnings com colaborador e data', () => {
    renderPanel({
      warnings: [
        warning({
          memberId: '',
          severity: 'atencao',
          ruleCode: 'onCallGap',
          date: '2026-07-03',
          message: 'Sem plantonista coberto em 03/07/2026.',
        }),
        warning({
          memberId: 'ana',
          severity: 'critico',
          ruleCode: 'sixByOne',
          date: '2026-07-07',
          message: 'Ana com 7 dias seguidos sem folga',
        }),
      ],
    });

    expect(screen.getAllByRole('button', { name: 'Ir para' })).toHaveLength(1);
    expect(within(screen.getByText('Cobertura de plantão').closest('article')!).queryByRole('button', { name: 'Ir para' })).toBeNull();
    expect(within(screen.getByText('Regra 6x1').closest('article')!).getByRole('button', { name: 'Ir para' })).toBeInTheDocument();
  });

  it('chama onNavigateToAlert com membro e data corretos ao clicar em "Ir para"', () => {
    const onNavigateToAlert = vi.fn();
    renderPanel({
      onNavigateToAlert,
      warnings: [
        warning({
          memberId: 'ana',
          severity: 'critico',
          ruleCode: 'sixByOne',
          date: '2026-07-07',
          message: 'Ana com 7 dias seguidos sem folga',
        }),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ir para' }));

    expect(onNavigateToAlert).toHaveBeenCalledWith('ana', '2026-07-07');
  });

  it('renderiza estado vazio quando não há erros nem warnings', () => {
    renderPanel();

    expect(screen.getByText('Nenhum alerta.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Erros impeditivos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Alertas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Informações' })).not.toBeInTheDocument();
  });
});
