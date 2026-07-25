import { AppDialog } from './AppDialog';
import { AppButton } from './AppButton';

export interface AppConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

/** Simple confirm/cancel dialog built on AppDialog — used by the publish-locally confirmation. */
export function AppConfirm({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: AppConfirmProps) {
  return (
    <AppDialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <AppButton variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </AppButton>
          <AppButton variant={confirmVariant} className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </AppButton>
        </>
      }
    >
      {message}
    </AppDialog>
  );
}
