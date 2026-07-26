import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Header } from '@/app/Header';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppPageHeader } from '@/components/AppPageHeader';
import { AppLoadingState } from '@/components/AppLoadingState';
import { AppEmptyState } from '@/components/AppEmptyState';
import { useAuth } from '@/app/auth';
import { useOrganizationRepository } from '@/app/services';
import type { Sector } from '@/domain/sector';

export function SectorsPage() {
  const { user } = useAuth();
  const organizationRepository = useOrganizationRepository();
  const [sectors, setSectors] = useState<Sector[] | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const organizations = await organizationRepository.listOrganizationsForUser(user.id);
      const allSectors = await organizationRepository.listSectors();
      const authorizations = await Promise.all(
        organizations.map((org) => organizationRepository.getAuthorization(user.id, org.id)),
      );
      const authorizedSectorIds = new Set(authorizations.flatMap((auth) => auth?.sectorIds ?? []));
      setSectors(allSectors.filter((sector) => authorizedSectorIds.has(sector.id)));
    })();
  }, [organizationRepository, user]);

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <AppPageHeader title={`Olá, ${user?.name}`} subtitle="Escolha o setor que deseja gerenciar." />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors === null && <AppLoadingState />}
          {sectors?.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <AppEmptyState title="Nenhum setor disponível para este usuário." />
            </div>
          )}
          {sectors?.map((sector) => (
            <AppCard key={sector.id} className="p-5" data-sector-id={sector.id}>
              <span className="text-[11px] font-medium uppercase tracking-wide text-orbita-text-faint">
                {sector.code}
              </span>
              <h2 className="mt-1 text-[16px] font-semibold text-white">{sector.name}</h2>
              <Link href={`/setores/${sector.id}/equipes`} className="mt-4 block">
                <AppButton variant="secondary" className="w-full">
                  Abrir setor
                </AppButton>
              </Link>
            </AppCard>
          ))}
        </div>
      </main>
    </div>
  );
}
