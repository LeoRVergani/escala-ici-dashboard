import { useState } from 'react';
import { AppButton } from '@/components/AppButton';
import { AppIconButton } from '@/components/AppIconButton';
import { AppInput } from '@/components/AppInput';
import { AppSelect } from '@/components/AppSelect';
import { AppSearchField } from '@/components/AppSearchField';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppAlert } from '@/components/AppAlert';
import { AppTooltip } from '@/components/AppTooltip';
import { AppTabs } from '@/components/AppTabs';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { AppEmptyState } from '@/components/AppEmptyState';
import { AppLoadingState } from '@/components/AppLoadingState';
import { AppPageHeader } from '@/components/AppPageHeader';
import { AppDialog } from '@/components/AppDialog';
import { AppConfirm } from '@/components/AppConfirm';
import { AppDrawer } from '@/components/AppDrawer';
import { AppDropdownMenu, AppDropdownItem } from '@/components/AppDropdownMenu';
import { useToast } from '@/components/AppToast';
import {
  AppIcon,
  APP_ICON_NAMES,
  APP_ICON_SIZES,
  type AppIconTone,
} from '@/components/AppIcon';
import { ShiftBadge } from '@/features/editor/ShiftBadge';
import { ConflictIndicator } from '@/features/editor/ConflictIndicator';
import type { ShiftCode } from '@/domain/schedule';

const ALL_SHIFTS: ShiftCode[] = [
  'madrugada',
  'manha',
  'tarde',
  'noite',
  'folga',
  'ferias',
  'plantao',
  'comercial',
  'extra',
  'afastamento',
  'custom',
];

const ALL_TONES: AppIconTone[] = ['default', 'muted', 'active', 'success', 'warning', 'danger'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-orbita-text-faint">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Dev-only Design System showcase — every reusable component/state in one place.
 * Registered only when import.meta.env.DEV (see src/app/App.tsx), never shipped to production.
 */
export function DesignSystemShowcasePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('one');
  const [search, setSearch] = useState('');
  const toast = useToast();

  return (
    <div className="min-h-screen bg-orbita-bg px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <AppPageHeader
          eyebrow="Somente em desenvolvimento"
          title="Design System — Órbita de Turnos"
          subtitle="Todos os componentes e estados reutilizáveis do dashboard, num só lugar."
        />

        <Section title="Botões">
          <div className="flex flex-wrap items-center gap-3">
            <AppButton variant="primary">Primário</AppButton>
            <AppButton variant="secondary">Secundário</AppButton>
            <AppButton variant="success">Publicar</AppButton>
            <AppButton variant="ghost">Ghost / link</AppButton>
            <AppButton variant="primary" disabled>
              Desabilitado
            </AppButton>
            <AppTooltip label="Ação com dica">
              <AppIconButton label="Ação com dica" variant="bordered">
                <AppIcon name="undo" decorative />
              </AppIconButton>
            </AppTooltip>
            <AppIconButton label="Notificações" variant="ghost">
              <AppIcon name="bell" decorative />
            </AppIconButton>
          </div>
        </Section>

        <Section title="Iconografia">
          <div className="space-y-6">
            <p className="text-[12px] text-orbita-text-muted">
              Conjunto único e oficial de ícones — lucide-react, sempre via <code>AppIcon</code>. Nunca emoji, glifo
              Unicode solto ou um import direto de <code>lucide-react</code> numa página.
            </p>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-orbita-text-faint uppercase">
                Conjunto completo ({APP_ICON_NAMES.length})
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
                {APP_ICON_NAMES.map((name) => (
                  <div
                    key={name}
                    className="flex flex-col items-center gap-1.5 rounded-[var(--radius-control)] border border-orbita-border/60 bg-orbita-elevated p-3 text-center"
                  >
                    <AppIcon name={name} size={20} />
                    <span className="text-[10px] break-all text-orbita-text-faint">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-orbita-text-faint uppercase">
                Tamanhos permitidos
              </p>
              <div className="flex flex-wrap items-end gap-5">
                {APP_ICON_SIZES.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1.5">
                    <AppIcon name="bell" size={size} />
                    <span className="text-[10px] text-orbita-text-faint">{size}px</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-orbita-text-faint uppercase">
                Tons semânticos
              </p>
              <div className="flex flex-wrap items-center gap-5">
                {ALL_TONES.map((tone) => (
                  <div key={tone} className="flex flex-col items-center gap-1.5">
                    <AppIcon name="warning" tone={tone} />
                    <span className="text-[10px] text-orbita-text-faint">{tone}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-control)] border border-orbita-success/40 bg-orbita-success/10 p-3">
                <p className="text-[11px] font-semibold text-orbita-success">Uso correto</p>
                <p className="mt-1 text-[12px] text-orbita-text-muted">
                  <AppIcon name="bell" size={14} tone="muted" className="mr-1 inline-block align-[-2px]" />
                  decorativo ao lado de texto; ou <code>decorative=false label=&quot;...&quot;</code> quando é a
                  única informação do controle (botão só com ícone).
                </p>
              </div>
              <div className="rounded-[var(--radius-control)] border border-orbita-danger/40 bg-orbita-danger/10 p-3">
                <p className="text-[11px] font-semibold text-orbita-danger">Uso proibido</p>
                <p className="mt-1 text-[12px] text-orbita-text-muted">
                  Emoji (sino, calendário, engrenagem...), glifo Unicode solto (marca de seleção, X, alerta...) ou{' '}
                  <code>import {'{ Bell }'} from &quot;lucide-react&quot;</code> direto numa página.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <AppBadge tone="success">Publicado</AppBadge>
            <AppBadge tone="warning">Rascunho</AppBadge>
            <AppBadge tone="info">Validado</AppBadge>
            <AppBadge tone="neutral">Sem escala</AppBadge>
          </div>
        </Section>

        <Section title="Turnos (ShiftBadge)">
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-orbita-border/60 bg-orbita-card p-4">
            {ALL_SHIFTS.map((shift) => (
              <ShiftBadge key={shift} shiftCode={shift} />
            ))}
            <ConflictIndicator message="Exemplo: 7 dias seguidos sem folga" />
          </div>
        </Section>

        <Section title="Campos">
          <div className="grid gap-4 sm:grid-cols-2">
            <AppInput label="Nome" placeholder="Ana Souza" />
            <AppInput label="Com erro" placeholder="login" error="Campo obrigatório" />
            <AppSelect label="Tipo de escala" defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              <option value="a">6×1 SOC/NOC</option>
              <option value="b">Plantão COSI</option>
            </AppSelect>
            <AppSearchField
              placeholder="Buscar colaborador"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
            />
          </div>
        </Section>

        <Section title="Alertas">
          <div className="space-y-2">
            <AppAlert tone="error">Erro impeditivo: arquivo não pertence à equipe selecionada.</AppAlert>
            <AppAlert tone="warning">Aviso: 2 colaboradores com 7 dias seguidos. Revisar antes de publicar.</AppAlert>
            <AppAlert tone="success">Sucesso: escala sincronizada com o aplicativo.</AppAlert>
            <AppAlert tone="info">Publicação local de desenvolvimento.</AppAlert>
          </div>
        </Section>

        <Section title="Estados vazio/carregando">
          <div className="grid gap-4 sm:grid-cols-2">
            <AppEmptyState title="Vazio útil" description="Nenhuma escala criada ainda. Comece importando seu XLS." />
            <AppCard className="grid place-items-center p-10">
              <AppLoadingState />
            </AppCard>
          </div>
        </Section>

        <Section title="Abas (AppTabs)">
          <AppTabs
            aria-label="Exemplo de abas"
            activeKey={tab}
            onChange={setTab}
            tabs={[
              { key: 'one', label: 'Criar vazia' },
              { key: 'two', label: 'Importar XLS/XLSX' },
            ]}
          />
        </Section>

        <Section title="Breadcrumb">
          <div className="flex flex-col gap-2">
            <AppBreadcrumb variant="pill" segments={['COSI', 'SOC']} />
            <AppBreadcrumb variant="plain" segments={['COSI', 'SOC', '26/07/2026 a 25/08/2026']} />
          </div>
        </Section>

        <Section title="Menu suspenso (AppDropdownMenu)">
          <AppDropdownMenu
            trigger={(triggerProps) => (
              <AppButton variant="secondary" {...triggerProps} className="flex items-center gap-1.5">
                Mais ações <AppIcon name="chevronDown" size={14} decorative />
              </AppButton>
            )}
          >
            <AppDropdownItem>Ação um</AppDropdownItem>
            <AppDropdownItem>Ação dois</AppDropdownItem>
          </AppDropdownMenu>
        </Section>

        <Section title="Overlays (Dialog / Confirm / Drawer)">
          <div className="flex flex-wrap gap-3">
            <AppButton variant="secondary" onClick={() => setDialogOpen(true)}>
              Abrir AppDialog
            </AppButton>
            <AppButton variant="secondary" onClick={() => setConfirmOpen(true)}>
              Abrir AppConfirm
            </AppButton>
            <AppButton variant="secondary" onClick={() => setDrawerOpen(true)}>
              Abrir AppDrawer
            </AppButton>
            <AppButton variant="secondary" onClick={() => toast.show('Exemplo de notificação.', 'success')}>
              Disparar AppToast
            </AppButton>
          </div>
          <AppDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Exemplo de AppDialog">
            Conteúdo de exemplo, focus-trapped e fechável com Escape.
          </AppDialog>
          <AppConfirm
            open={confirmOpen}
            title="Confirmar ação?"
            message="Exemplo de AppConfirm — construído sobre AppDialog."
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
          />
          <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Exemplo de AppDrawer">
            Painel lateral de exemplo, usado para gerenciar colaboradores no editor.
          </AppDrawer>
        </Section>
      </div>
    </div>
  );
}
