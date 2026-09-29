'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validation/chat';
import { safeRedirect } from '@/lib/auth/safeRedirect';

export async function signInAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) {
    redirect('/login?error=1');
  }

  const { email, password, next } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=1');
  }

  redirect(safeRedirect(next) ?? '/chat');
}

export async function signUpAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    display_name: formData.get('display_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    password_confirmation: formData.get('password_confirmation'),
  });
  if (!parsed.success) {
    const confirmationError = parsed.error.issues.some(
      (issue) => issue.path[0] === 'password_confirmation'
    );
    redirect(`/register?error=${confirmationError ? 'password_mismatch' : 'invalid'}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.display_name } },
  });

  if (error) {
    redirect('/register?error=exists');
  }

  redirect('/login?registered=1');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
