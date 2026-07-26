import { LoginHeader } from './components/LoginHeader';
import { LoginHero } from './components/LoginHero';

export function LoginPage() {
  return (
    <div className="orbita-bg-grid relative min-h-screen overflow-hidden bg-orbita-bg text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_70%_25%,rgba(59,130,246,0.16),transparent_60%)]"
      />
      <LoginHeader />
      <LoginHero />
    </div>
  );
}
