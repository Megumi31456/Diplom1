"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

export async function sendMessageAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const recipient_id = String(formData.get("recipient_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!recipient_id || !body) redirectWithParams("/app/messages", { error: "Выберите получателя и введите сообщение" });
  if (recipient_id === user.id) redirectWithParams("/app/messages", { error: "Нельзя отправить сообщение самому себе" });

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(`and(user_a.eq.${user.id},user_b.eq.${recipient_id}),and(user_a.eq.${recipient_id},user_b.eq.${user.id})`)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data: created, error: conversationError } = await supabase
      .from("conversations")
      .insert({ user_a: user.id, user_b: recipient_id })
      .select("id")
      .single();
    if (conversationError) redirectWithParams("/app/messages", { error: conversationError.message });
    conversationId = created.id;
  }

  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body });
  if (error) redirectWithParams("/app/messages", { error: error.message });

  revalidatePath("/app/messages");
  redirectWithParams(`/app/messages/${conversationId}`, { message: "Сообщение отправлено" });
}
