import { AppShell } from '@/components/station/app-shell';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
