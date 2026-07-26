import { useState } from 'react';
import { AppDialog } from '@/components/AppDialog';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { AppAlert } from '@/components/AppAlert';
import { useToast } from '@/components/AppToast';
import { useAuth } from '@/app/auth';
import { useOrganizationRepository } from '@/app/services';
import type { Organization } from '@/domain/organization';

interface OrganizationCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function OrganizationCreateDialog({ open, onClose, onCreated }: OrganizationCreateDialogProps) {
  const { user } = useAuth();
  const organizationRepository = useOrganizationRepository();
  const { show } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCode('');
    setDescription('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!name.trim() || !code.trim()) {
      setError('Nome e código são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      const organization: Organization = await organizationRepository.createOrganization(
        { name: name.trim(), code: code.trim().toUpperCase(), description: description.trim() || undefined },
        { userId: user.id, displayName: user.name },
      );
      show(`Organização ${organization.name} criada.`, 'success');
      onCreated();
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title="Criar organização"
      footer={
        <>
          <AppButton type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancelar
          </AppButton>
          <AppButton type="button" variant="primary" className="flex-1" disabled={submitting} onClick={() => void handleCreate()}>
            Criar
          </AppButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <AppInput label="Nome" value={name} onChange={(event) => setName(event.target.value)} placeholder="ex: ICI" />
        <AppInput label="Código" value={code} onChange={(event) => setCode(event.target.value)} placeholder="ex: ICI" />
        <AppInput
          label="Descrição (opcional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="ex: Instituto das Cidades Inteligentes"
        />
        {error && <AppAlert tone="error">{error}</AppAlert>}
      </form>
    </AppDialog>
  );
}
