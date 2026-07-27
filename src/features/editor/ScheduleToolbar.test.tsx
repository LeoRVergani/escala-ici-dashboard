import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleToolbar } from './ScheduleToolbar';

function renderToolbar({ alertCount = 2, onOpenAlerts = vi.fn() } = {}) {
  const result = render(
    <ScheduleToolbar
      canUndo={false}
      canRedo={false}
      onUndo={vi.fn()}
      onRedo={vi.fn()}
      onSave={vi.fn()}
      alertCount={alertCount}
      onOpenAlerts={onOpenAlerts}
      onAddMember={vi.fn()}
      members={[]}
      onRemoveMember={vi.fn()}
      onCopyDay={vi.fn()}
      onPasteDay={vi.fn()}
      onCopyWeek={vi.fn()}
      onPasteWeek={vi.fn()}
      hasClipboard={false}
    />,
  );

  return { ...result, onOpenAlerts };
}

describe('ScheduleToolbar', () => {
  it('chama onOpenAlerts ao clicar no badge de alertas', () => {
    const onOpenAlerts = vi.fn();
    renderToolbar({ onOpenAlerts });

    fireEvent.click(screen.getByRole('button', { name: 'Ver 2 alertas' }));

    expect(onOpenAlerts).toHaveBeenCalledTimes(1);
  });
});
