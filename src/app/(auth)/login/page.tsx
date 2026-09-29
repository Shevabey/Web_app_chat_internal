import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; registered?: string }>;
}) {
  const { error, next, registered } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] animate-slide-up">
          <div className="rounded-2xl border border-border bg-bg p-8 shadow-card">
            <h1 className="text-2xl font-bold text-fg mb-6">Masuk</h1>
            {registered === "1" && (
              <p className="mb-4 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg">
                Akun berhasil dibuat. Silakan aktifkan email Anda jika diminta,
                lalu masuk.
              </p>
            )}
            <LoginForm hasError={!!error} next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}
