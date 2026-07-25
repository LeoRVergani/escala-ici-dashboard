interface SelectionOverlayProps {
  active: boolean;
  variant?: 'selected' | 'dragTarget';
}

/** Visual highlight painted over a grid cell — selection ring or drag drop-target tint. */
export function SelectionOverlay({ active, variant = 'selected' }: SelectionOverlayProps) {
  if (!active) return null;
  const className =
    variant === 'selected'
      ? 'ring-2 ring-inset ring-orbita-blue'
      : 'bg-orbita-blue/20';
  return <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`} />;
}
