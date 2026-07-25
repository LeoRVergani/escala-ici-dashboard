interface AppBreadcrumbProps {
  segments: string[];
  variant?: 'pill' | 'plain';
}

/** "COSI / SOC" style breadcrumb — pill variant for the header capsule, plain for in-page subtitles. */
export function AppBreadcrumb({ segments, variant = 'plain' }: AppBreadcrumbProps) {
  const text = segments.join(' / ');
  if (variant === 'pill') {
    return (
      <span className="shrink-0 rounded-[var(--radius-pill)] border border-orbita-blue/30 bg-orbita-blue/10 px-3 py-1 text-[12px] font-medium text-orbita-blue">
        {text}
      </span>
    );
  }
  return <p className="text-[12px] text-orbita-text-faint">{text}</p>;
}
