import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrbitBrand, ORBITA_MARK_SRC } from './OrbitBrand';

describe('OrbitBrand (scenario: marca única, sem implementações independentes por tela)', () => {
  it('defaults to the login variant — the ICI lettermark square + full wordmark', () => {
    render(<OrbitBrand />);
    expect(screen.getByText('ICI')).toBeInTheDocument();
    expect(screen.getByText('ESCALA ICI')).toBeInTheDocument();
  });

  it('renders the sidebar variant — mark icon + "Escala" + "ICI" badge, from the same asset', () => {
    const { container } = render(<OrbitBrand variant="sidebar" />);
    expect(screen.getByText('Escala')).toBeInTheDocument();
    expect(screen.getByText('ICI')).toBeInTheDocument();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', ORBITA_MARK_SRC);
  });

  it('renders the compact variant — icon only, same asset as sidebar', () => {
    const { container } = render(<OrbitBrand variant="compact" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', ORBITA_MARK_SRC);
    expect(screen.queryByText('Escala')).not.toBeInTheDocument();
  });

  it('sidebar and compact variants point at the exact same mark source — never a second, diverging asset', () => {
    const sidebar = render(<OrbitBrand variant="sidebar" />);
    const sidebarSrc = sidebar.container.querySelector('img')?.getAttribute('src');
    sidebar.unmount();

    const compact = render(<OrbitBrand variant="compact" />);
    const compactSrc = compact.container.querySelector('img')?.getAttribute('src');

    expect(sidebarSrc).toBe(ORBITA_MARK_SRC);
    expect(compactSrc).toBe(ORBITA_MARK_SRC);
    expect(sidebarSrc).toBe(compactSrc);
  });
});
