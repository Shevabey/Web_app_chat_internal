"use client";

import { useTransition } from "react";
import { signUpAction } from "@/app/(auth)/actions";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";

export function RegisterForm({ errorMsg }: { errorMsg: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => signUpAction(formData))}
      className="space-y-4">
      {errorMsg && <ErrorBox message={errorMsg} />}
      <Input
        label="Nama"
        type="text"
        name="display_name"
        required
        autoComplete="name"
        autoFocus
        placeholder="Nama Anda"
      />
      <Input
        label="Email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="nama@akselera.tech"
      />
      <PasswordInput
        label="Password"
        name="password"
        required
        autoComplete="new-password"
        placeholder="Minimal 8 karakter"
      />
      <PasswordInput
        label="Konfirmasi password"
        name="password_confirmation"
        required
        autoComplete="new-password"
        placeholder="Ulangi password"
      />
      <Button type="submit" loading={pending} className="w-full">
        {pending ? "Memproses…" : "Daftar"}
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Sudah punya akun?{" "}
        <a href="/login" className="font-semibold text-fg hover:underline">
          Masuk
        </a>
      </p>
    </form>
  );
}
