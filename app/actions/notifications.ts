"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

function refreshNotifications() {
  revalidatePath("/app/notifications");
  revalidatePath("/app", "layout");
}

export async function markNotificationReadAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  refreshNotifications();
}

export async function markAllNotificationsReadAction() {
  const { user, supabase } = await requireUser();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  refreshNotifications();
  redirectWithParams("/app/notifications", { message: "Уведомления отмечены как прочитанные" });
}

export async function deleteNotificationAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", user.id).eq("is_read", true);
  refreshNotifications();
  if (error) redirectWithParams("/app/notifications", { error: error.message });
}

export async function deleteAllReadNotificationsAction() {
  const { user, supabase } = await requireUser();
  const { error } = await supabase.from("notifications").delete().eq("user_id", user.id).eq("is_read", true);
  refreshNotifications();
  redirectWithParams("/app/notifications", error ? { error: error.message } : { message: "Все прочитанные уведомления удалены" });
}
