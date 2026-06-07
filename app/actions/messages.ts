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
    if (conversationError || !created) redirectWithParams("/app/messages", { error: conversationError?.message || "Не удалось создать диалог" });
    conversationId = created!.id;
  }

  const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body });
  if (error) redirectWithParams("/app/messages", { error: error.message });

  revalidatePath("/app/messages");
  redirectWithParams(`/app/messages/${conversationId}`, { message: "Сообщение отправлено" });
}



export async function markConversationReadAction(conversationId: string) {
  const { user, supabase } = await requireUser();
  const id = String(conversationId ?? "").trim();
  if (!id) return false;

  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("is_read", false)
    .select("id");

  if (error) {
    console.error("Не удалось отметить сообщения прочитанными:", error.message);
    return false;
  }

  if ((data?.length ?? 0) > 0) {
    revalidatePath("/app", "layout");
    revalidatePath("/app/messages");
    revalidatePath(`/app/messages/${id}`);
    return true;
  }

  return false;
}

export async function deleteMessageAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const message_id = String(formData.get("message_id") ?? "").trim();
  const conversation_id = String(formData.get("conversation_id") ?? "").trim();

  if (!message_id || !conversation_id) redirectWithParams("/app/messages", { error: "Сообщение не найдено" });

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", message_id)
    .eq("conversation_id", conversation_id)
    .eq("sender_id", user.id);

  if (error) redirectWithParams(`/app/messages/${conversation_id}`, { error: error.message });

  revalidatePath("/app/messages");
  revalidatePath(`/app/messages/${conversation_id}`);
  redirectWithParams(`/app/messages/${conversation_id}`, { message: "Сообщение удалено" });
}
