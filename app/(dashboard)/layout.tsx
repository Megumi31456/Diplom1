import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, supabase } = await requireUser();
  const [{ count: unreadNotifications }, { count: unreadMessages }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    supabase.from("messages").select("id", { count: "exact", head: true }).neq("sender_id", user.id).eq("is_read", false),
  ]);
  return <AppShell role={profile?.role} name={profile?.full_name} unreadNotifications={unreadNotifications ?? 0} unreadMessages={unreadMessages ?? 0}>{children}</AppShell>;
}
