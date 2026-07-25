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
import { Icon } from '@/design-system/icons';
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
                {Icon.undo}
              </AppIconButton>
            </AppTooltip>
            <AppIconButton label="Notificações" variant="ghost">
              {Icon.bell}
            </AppIconButton>
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
              <AppButton variant="secondary" {...triggerProps}>
                Mais ações {Icon.chevronDown}
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
