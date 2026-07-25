import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellActionMenu } from './CellActionMenu';

const OPTIONS = ['manha', 'tarde', 'noite', 'folga', 'custom'] as const;

describe('CellActionMenu (scenarios: menu não é cortado, Escape fecha menu)', () => {
  it('renders via portal directly under document.body, not inside a clipped ancestor', () => {
    const { container } = render(
      <div style={{ overflow: 'hidden', width: 10, height: 10 }}>
        <CellActionMenu
          anchor={{ x: 50, y: 50 }}
          options={[...OPTIONS]}
          selectionCount={1}
          onSelect={() => {}}
          onClear={() => {}}
          onClose={() => {}}
        />
      </div>,
    );
    const menu = screen.getByTestId('cell-menu');
    expect(menu.parentElement).toBe(document.body);
    expect(container.contains(menu)).toBe(false);
  });

  it('uses fixed positioning so scrolling never detaches it from the click point', () => {
    render(
      <CellActionMenu
        anchor={{ x: 50, y: 50 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={() => {}}
        onClear={() => {}}
        onClose={() => {}}
      />,
    );
    const menu = screen.getByTestId('cell-menu');
    expect(menu.style.position).toBe('fixed');
  });

  it('clamps its position so it never renders past the viewport edge', () => {
    render(
      <CellActionMenu
        anchor={{ x: window.innerWidth + 500, y: window.innerHeight + 500 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={() => {}}
        onClear={() => {}}
        onClose={() => {}}
      />,
    );
    const menu = screen.getByTestId('cell-menu');
    const left = Number(menu.style.left.replace('px', ''));
    const top = Number(menu.style.top.replace('px', ''));
    expect(left).toBeLessThan(window.innerWidth);
    expect(top).toBeLessThan(window.innerHeight);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <CellActionMenu
        anchor={{ x: 50, y: 50 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={() => {}}
        onClear={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking outside the menu', () => {
    const onClose = vi.fn();
    render(
      <div>
        <button>outside</button>
        <CellActionMenu
          anchor={{ x: 50, y: 50 }}
          options={[...OPTIONS]}
          selectionCount={1}
          onSelect={() => {}}
          onClear={() => {}}
          onClose={onClose}
        />
      </div>,
    );
    fireEvent.pointerDown(screen.getByText('outside'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the menu', () => {
    const onClose = vi.fn();
    render(
      <CellActionMenu
        anchor={{ x: 50, y: 50 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={() => {}}
        onClear={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.pointerDown(screen.getByTestId('cell-menu'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onSelect with the chosen shift', () => {
    const onSelect = vi.fn();
    render(
      <CellActionMenu
        anchor={{ x: 50, y: 50 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={onSelect}
        onClear={() => {}}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByTitle('M'));
    expect(onSelect).toHaveBeenCalledWith('manha');
  });

  it('calls onClear when "Limpar célula" is clicked', () => {
    const onClear = vi.fn();
    render(
      <CellActionMenu
        anchor={{ x: 50, y: 50 }}
        options={[...OPTIONS]}
        selectionCount={1}
        onSelect={() => {}}
        onClear={onClear}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Limpar célula'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
