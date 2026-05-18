"use server";

import { revalidatePath } from "next/cache";
import { requireModerator } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

const POST_ACTION_TO_STATUS: Record<string, string> = {
  approve: "published",
  hide: "hidden",
  reject: "rejected",
  revise: "revision",
  duplicate: "duplicate",
};

const POST_ACTION_TO_MESSAGE: Record<string, string> = {
  approve: "Публикация одобрена и опубликована",
  hide: "Публикация скрыта",
  reject: "Публикация отклонена",
  revise: "Публикация отправлена автору на доработку",
  duplicate: "Публикация отмечена как дубликат",
};

const REPORT_STATUSES = new Set(["resolved", "rejected", "in_progress"]);

function moderatorError(path: string, message: string) {
  redirectWithParams(path, { error: message });
}

export async function moderatePostAction(formData: FormData) {
  const { user, supabase } = await requireModerator();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const nextStatus = POST_ACTION_TO_STATUS[action];

  if (!post_id || !nextStatus) moderatorError("/moderator", "Некорректное действие модерации");

  const { data: post, error: readError } = await supabase.from("posts").select("id,author_id,title").eq("id", post_id).single();
  if (readError) moderatorError("/moderator", `Публикация не найдена: ${readError.message}`);

  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: nextStatus, moderation_note: reason || null })
    .eq("id", post_id)
    .select("id")
    .single();

  if (updateError) moderatorError("/moderator", `Не удалось изменить статус публикации: ${updateError.message}`);

  const { error: logError } = await supabase.from("moderation_logs").insert({
    moderator_id: user.id,
    target_type: "post",
    post_id,
    action,
    reason: reason || POST_ACTION_TO_MESSAGE[action],
  });

  if (logError) moderatorError("/moderator", `Статус изменён, но запись в журнал не создана: ${logError.message}`);

  await supabase.from("notifications").insert({
    user_id: post.author_id,
    title: "Решение модерации",
    body: `${POST_ACTION_TO_MESSAGE[action]}: ${post.title}${reason ? `. Комментарий: ${reason}` : ""}`,
  });

  revalidatePath("/moderator");
  revalidatePath("/app");
  revalidatePath(`/app/post/${post_id}`);
  redirectWithParams("/moderator", { message: POST_ACTION_TO_MESSAGE[action] });
}

export async function resolveReportAction(formData: FormData) {
  const { user, supabase } = await requireModerator();
  const report_id = String(formData.get("report_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const resolution = String(formData.get("resolution") ?? "").trim();

  if (!report_id || !REPORT_STATUSES.has(status)) moderatorError("/moderator/reports", "Некорректное решение по жалобе");

  const { error: updateError } = await supabase
    .from("reports")
    .update({ status, resolved_by: user.id, resolution })
    .eq("id", report_id)
    .select("id")
    .single();

  if (updateError) moderatorError("/moderator/reports", `Не удалось обновить жалобу: ${updateError.message}`);

  const { error: logError } = await supabase.from("moderation_logs").insert({
    moderator_id: user.id,
    target_type: "report",
    report_id,
    action: status,
    reason: resolution,
  });

  if (logError) moderatorError("/moderator/reports", `Жалоба обновлена, но запись в журнал не создана: ${logError.message}`);

  revalidatePath("/moderator");
  revalidatePath("/moderator/reports");
  redirectWithParams("/moderator/reports", {
    message: status === "resolved" ? "Жалоба подтверждена" : status === "rejected" ? "Жалоба отклонена" : "Жалоба взята в работу",
  });
}

export async function moderateCommentAction(formData: FormData) {
  const { user, supabase } = await requireModerator();
  const comment_id = String(formData.get("comment_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!comment_id || !["hide", "restore", "delete"].includes(action)) moderatorError("/moderator/comments", "Некорректное действие с комментарием");

  const { data: comment, error: readError } = await supabase.from("comments").select("id,post_id,user_id,body").eq("id", comment_id).single();
  if (readError) moderatorError("/moderator/comments", `Комментарий не найден: ${readError.message}`);

  const request = action === "delete"
    ? supabase.from("comments").delete().eq("id", comment_id)
    : supabase.from("comments").update({ is_hidden: action === "hide" }).eq("id", comment_id);
  const { error } = await request;
  if (error) moderatorError("/moderator/comments", error.message);

  await supabase.from("moderation_logs").insert({
    moderator_id: user.id,
    target_type: "comment",
    action,
    reason: reason || (action === "hide" ? "Комментарий скрыт" : action === "restore" ? "Комментарий восстановлен" : "Комментарий удалён"),
  });

  await supabase.from("notifications").insert({
    user_id: comment.user_id,
    title: "Решение по комментарию",
    body: action === "hide" ? `Ваш комментарий скрыт. ${reason}` : action === "restore" ? "Ваш комментарий восстановлен" : `Ваш комментарий удалён. ${reason}`,
  });

  revalidatePath("/moderator/comments");
  revalidatePath(`/app/post/${comment.post_id}`);
  redirectWithParams("/moderator/comments", { message: action === "hide" ? "Комментарий скрыт" : action === "restore" ? "Комментарий восстановлен" : "Комментарий удалён" });
}
