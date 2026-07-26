import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrbitBrand, ORBITA_MARK_SRC } from './OrbitBrand';

describe('OrbitBrand (scenario: marca única e oficial, sem implementações independentes por tela)', () => {
  it('defaults to the login variant — the official mark icon + full wordmark', () => {
    const { container } = render(<OrbitBrand />);
    expect(screen.getByText('ESCALA ICI')).toBeInTheDocument();
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', ORBITA_MARK_SRC);
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

  it('every variant points at the exact same official mark source — never a second, diverging asset', () => {
    const variants = ['login', 'sidebar', 'compact'] as const;
    const sources = variants.map((variant) => {
      const rendered = render(<OrbitBrand variant={variant} />);
      const src = rendered.container.querySelector('img')?.getAttribute('src');
      rendered.unmount();
      return src;
    });

    expect(sources.every((src) => src === ORBITA_MARK_SRC)).toBe(true);
  });
});
