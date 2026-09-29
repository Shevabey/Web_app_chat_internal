import { RegisterForm } from "@/components/auth/RegisterForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const errorMessages: Record<string, string> = {
    invalid: "Periksa kembali nama, email, dan password Anda.",
    password_mismatch: "Password dan konfirmasi password harus sama.",
    exists: "Email sudah terdaftar. Silakan masuk.",
  };
  const errorMsg = error
    ? (errorMessages[error] ?? "Gagal mendaftar. Periksa data Anda.")
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border">
        <Logo />
        <ThemeToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] animate-slide-up">
          <div className="rounded-2xl border border-border bg-bg p-8 shadow-card">
            <h1 className="text-2xl font-bold text-fg mb-6">Daftar</h1>
            <RegisterForm errorMsg={errorMsg} />
          </div>
        </div>
      </div>
    </div>
  );
}
