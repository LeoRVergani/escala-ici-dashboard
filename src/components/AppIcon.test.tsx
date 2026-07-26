import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppIcon, APP_ICON_NAMES, APP_ICON_SIZES } from './AppIcon';

describe('AppIcon (checkpoint 1C — sistema único de ícones)', () => {
  it('renders a known icon decoratively by default (aria-hidden, no accessible name)', () => {
    const { container } = render(<AppIcon name="bell" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('renders as an informative icon when decorative={false}, with role=img and the given label', () => {
    render(<AppIcon name="warning" decorative={false} label="Alerta: conflito de turno" />);
    expect(screen.getByRole('img', { name: 'Alerta: conflito de turno' })).toBeInTheDocument();
  });

  it('warns in dev when decorative={false} has no label, but still renders without crashing', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<AppIcon name="warning" decorative={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('applies the requested size as width/height', () => {
    for (const size of APP_ICON_SIZES) {
      const { container, unmount } = render(<AppIcon name="bell" size={size} />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('width')).toBe(String(size));
      expect(svg.getAttribute('height')).toBe(String(size));
      unmount();
    }
  });

  it('applies the requested strokeWidth', () => {
    const { container } = render(<AppIcon name="bell" strokeWidth={2} />);
    expect(container.querySelector('svg')).toHaveAttribute('stroke-width', '2');
  });

  it('"default" tone applies no color utility, so the icon inherits the parent text color', () => {
    // Regression: a hardcoded "default" color here would fight a parent's own
    // text color via Tailwind's generated-CSS order (not JSX order) — e.g. the
    // arrow on the white "Entrar com Microsoft" button needs the button's dark
    // text, not the design system's light-on-dark default.
    const { container } = render(<AppIcon name="arrowRight" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).not.toMatch(/text-orbita-/);
  });

  it('semantic tones map to design tokens, never a literal hex color', () => {
    const { container } = render(<AppIcon name="warning" tone="danger" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('class')).toContain('text-orbita-danger');
    expect(svg.getAttribute('class')).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it('every registered icon name renders a real <svg>, never falling back to text/emoji', () => {
    for (const name of APP_ICON_NAMES) {
      const { container, unmount } = render(<AppIcon name={name} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
      expect(container.textContent).toBe('');
      unmount();
    }
  });
});
