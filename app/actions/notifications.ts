"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

export async function markNotificationReadAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/notifications");
}

export async function markAllNotificationsReadAction() {
  const { user, supabase } = await requireUser();
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/app/notifications");
  redirectWithParams("/app/notifications", { message: "Уведомления отмечены как прочитанные" });
}
