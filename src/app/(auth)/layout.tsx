import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/chat');

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex justify-end p-4">
        {/* ThemeToggle is client; rendered in the page itself */}
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
