"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

export async function toggleFollowAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const following_id = String(formData.get("following_id") ?? "").trim();
  const next = String(formData.get("next") ?? `/app/profile/${following_id}`);

  if (!following_id || following_id === user.id) redirectWithParams(next, { error: "Нельзя подписаться на этот профиль" });

  const { data: existing } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .eq("following_id", following_id)
    .maybeSingle();

  if (existing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", following_id);
  else await supabase.from("follows").insert({ follower_id: user.id, following_id });

  revalidatePath(next);
  revalidatePath("/app");
  redirectWithParams(next, { message: existing ? "Подписка отменена" : "Подписка оформлена" });
}
