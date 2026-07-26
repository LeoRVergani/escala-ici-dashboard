import { AppBadge } from '@/components/AppBadge';
import { Brand } from '@/components/Brand';
import { Icon } from '@/design-system/icons';

export function LoginHeader() {
  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-10">
      <Brand />
      <AppBadge tone="success" dot={false}>
        <span aria-hidden="true">{Icon.shield}</span> Acesso corporativo protegido
      </AppBadge>
    </header>
  );
}
