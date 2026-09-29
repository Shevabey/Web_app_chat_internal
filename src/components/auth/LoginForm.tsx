"use client";

import { useTransition } from "react";
import { signInAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";

export function LoginForm({
  hasError,
  next,
}: {
  hasError: boolean;
  next?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => signInAction(formData))}
      className="space-y-4">
      {hasError && <ErrorBox message="Email atau password salah" />}
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        label="Email"
        type="email"
        name="email"
        required
        autoComplete="email"
        autoFocus
        placeholder="nama@akselera.tech"
      />
      <PasswordInput
        label="Password"
        name="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Memproses…" : "Masuk"}
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Belum punya akun?{" "}
        <a href="/register" className="font-semibold text-fg hover:underline">
          Daftar
        </a>
      </p>
    </form>
  );
}
