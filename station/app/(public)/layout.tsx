import { AppShell } from '@/components/station/app-shell';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
