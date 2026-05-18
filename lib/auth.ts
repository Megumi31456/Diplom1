import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, isModerator } from "@/lib/utils";

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile, supabase };
}

export async function requireUser() {
  const ctx = await getSessionProfile();
  if (!ctx.user) redirect("/login");
  return ctx;
}

export async function requireModerator() {
  const ctx = await requireUser();
  if (!isModerator(ctx.profile?.role)) redirect("/app");
  return ctx;
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (!isAdmin(ctx.profile?.role)) redirect("/app");
  return ctx;
}
