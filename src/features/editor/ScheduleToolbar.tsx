import { useState } from 'react';
import { AppButton } from '@/components/AppButton';
import { AppIconButton } from '@/components/AppIconButton';
import { AppTooltip } from '@/components/AppTooltip';
import { AppDropdownMenu, AppDropdownItem } from '@/components/AppDropdownMenu';
import { AppDialog } from '@/components/AppDialog';
import { AppDrawer } from '@/components/AppDrawer';
import { AppInput } from '@/components/AppInput';
import { AppBadge } from '@/components/AppBadge';
import { AppIcon } from '@/components/AppIcon';

interface ScheduleToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  alertCount: number;
  onAddMember: (name: string, corporateLogin: string) => void;
  members: { id: string; name: string }[];
  onRemoveMember: (memberId: string) => void;
  onCopyDay: () => void;
  onPasteDay: () => void;
  onCopyWeek: () => void;
  onPasteWeek: () => void;
  hasClipboard: boolean;
}

/** Editor action bar: undo/redo, save, alert count, and the "Mais ações" menu. */
export function ScheduleToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  alertCount,
  onAddMember,
  members,
  onRemoveMember,
  onCopyDay,
  onPasteDay,
  onCopyWeek,
  onPasteWeek,
  hasClipboard,
}: ScheduleToolbarProps) {
  const [addingMember, setAddingMember] = useState(false);
  const [managingMembers, setManagingMembers] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLogin, setNewLogin] = useState('');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orbita-border/60 px-1 py-3">
      <div className="flex items-center gap-2">
        <AppTooltip label="Desfazer">
          <AppIconButton label="Desfazer" variant="bordered" disabled={!canUndo} onClick={onUndo}>
            <AppIcon name="undo" decorative />
          </AppIconButton>
        </AppTooltip>
        <AppTooltip label="Refazer">
          <AppIconButton label="Refazer" variant="bordered" disabled={!canRedo} onClick={onRedo}>
            <AppIcon name="redo" decorative />
          </AppIconButton>
        </AppTooltip>
        <AppButton variant="secondary" onClick={onSave}>
          Salvar
        </AppButton>
      </div>
      <div className="flex items-center gap-2">
        {alertCount > 0 && (
          <AppBadge tone="warning">
            <AppIcon name="warning" size={14} tone="warning" /> {alertCount} {alertCount === 1 ? 'alerta' : 'alertas'}
          </AppBadge>
        )}
        <AppDropdownMenu
          trigger={(triggerProps) => (
            <AppButton variant="secondary" {...triggerProps} className="flex items-center gap-1.5">
              Mais ações <AppIcon name="chevronDown" size={14} decorative />
            </AppButton>
          )}
        >
          <AppDropdownItem onClick={() => setAddingMember(true)}>Adicionar colaborador</AppDropdownItem>
          <AppDropdownItem onClick={() => setManagingMembers(true)}>Remover colaborador</AppDropdownItem>
          <div className="my-1 h-px bg-orbita-border" />
          <AppDropdownItem onClick={onCopyDay}>Copiar dia selecionado</AppDropdownItem>
          <AppDropdownItem disabled={!hasClipboard} onClick={onPasteDay}>
            Colar dia
          </AppDropdownItem>
          <AppDropdownItem onClick={onCopyWeek}>Copiar semana selecionada</AppDropdownItem>
          <AppDropdownItem disabled={!hasClipboard} onClick={onPasteWeek}>
            Colar semana
          </AppDropdownItem>
        </AppDropdownMenu>
      </div>

      <AppDialog
        open={addingMember}
        onClose={() => setAddingMember(false)}
        title="Adicionar colaborador"
        footer={
          <>
            <AppButton variant="secondary" className="flex-1" onClick={() => setAddingMember(false)}>
              Cancelar
            </AppButton>
            <AppButton
              variant="primary"
              className="flex-1"
              disabled={!newName.trim() || !newLogin.trim()}
              onClick={() => {
                onAddMember(newName.trim(), newLogin.trim());
                setNewName('');
                setNewLogin('');
                setAddingMember(false);
              }}
            >
              Adicionar
            </AppButton>
          </>
        }
      >
        <div className="space-y-3">
          <AppInput label="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <AppInput label="Login corporativo" value={newLogin} onChange={(e) => setNewLogin(e.target.value)} />
        </div>
      </AppDialog>

      <AppDrawer open={managingMembers} onClose={() => setManagingMembers(false)} title="Remover colaborador">
        <div className="max-h-[70vh] space-y-1 overflow-auto">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-[var(--radius-control)] px-2 py-1.5 hover:bg-orbita-elevated">
              <span className="text-[13px] text-white">{m.name}</span>
              <button
                onClick={() => onRemoveMember(m.id)}
                className="focus-ring text-[12px] text-orbita-danger hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
          {members.length === 0 && <p className="text-[12px] text-orbita-text-faint">Nenhum colaborador nesta escala.</p>}
        </div>
      </AppDrawer>
    </div>
  );
}
