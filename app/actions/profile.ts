"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

function arr(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export async function updateProfileAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar_url = String(formData.get("avatar_url") ?? "").trim();
  const interests = arr(formData.get("interests"));

  if (!full_name) redirectWithParams("/app/profile", { error: "Введите имя профиля" });

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, bio, avatar_url: avatar_url || null, interests, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) redirectWithParams("/app/profile", { error: error.message });

  revalidatePath("/app/profile");
  redirectWithParams("/app/profile", { message: "Профиль обновлён" });
}
