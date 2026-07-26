import { AppBadge } from '@/components/AppBadge';
import { OrbitBrand } from '@/components/OrbitBrand';
import { Icon } from '@/design-system/icons';

export function LoginHeader() {
  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-10">
      <OrbitBrand variant="login" />
      <AppBadge tone="success" dot={false}>
        <span aria-hidden="true">{Icon.shield}</span> Acesso corporativo protegido
      </AppBadge>
    </header>
  );
}
