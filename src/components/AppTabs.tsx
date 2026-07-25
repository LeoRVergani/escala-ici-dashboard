export interface AppTabItem {
  key: string;
  label: string;
}

interface AppTabsProps {
  tabs: AppTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  'aria-label': string;
}

/** Segmented tab bar — used by the "Criar vazia / Importar XLS/XLSX" toggle. */
export function AppTabs({ tabs, activeKey, onChange, 'aria-label': ariaLabel }: AppTabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-2 rounded-[var(--radius-control)] border border-orbita-border bg-orbita-card p-1">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`focus-ring flex-1 rounded-[calc(var(--radius-control)-2px)] px-3 py-2 text-[13px] font-medium transition ${
              active ? 'bg-orbita-elevated text-white' : 'text-orbita-text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
