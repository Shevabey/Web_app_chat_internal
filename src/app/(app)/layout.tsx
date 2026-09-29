import { requireUser } from '@/lib/auth/requireUser';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <>{children}</>;
}
