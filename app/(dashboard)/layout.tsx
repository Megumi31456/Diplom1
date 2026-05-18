import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  return <AppShell role={profile?.role} name={profile?.full_name}>{children}</AppShell>;
}
