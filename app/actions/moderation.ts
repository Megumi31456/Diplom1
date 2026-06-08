"use server";

import { revalidatePath } from "next/cache";
import { requireModerator } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";
import { getContentRules } from "@/lib/platform-settings";

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
  if (readError || !post) moderatorError("/moderator", `Публикация не найдена: ${readError?.message || "нет данных"}`);
  const postData = post!;

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
    user_id: postData.author_id,
    title: "Решение модерации",
    body: `${POST_ACTION_TO_MESSAGE[action]}: ${postData.title}${reason ? `. Комментарий: ${reason}` : ""}`,
  });

  revalidatePath("/moderator");
  revalidatePath("/app");
  revalidatePath(`/app/post/${post_id}`);
  redirectWithParams("/moderator", { message: POST_ACTION_TO_MESSAGE[action] });
}

async function countResolvedReportsFromDifferentUsers(
  supabase: any,
  targetType: "post" | "comment",
  targetId: string,
) {
  const query = supabase
    .from("reports")
    .select("reporter_id")
    .eq("target_type", targetType)
    .eq("status", "resolved");

  if (targetType === "post") query.eq("post_id", targetId);
  else query.eq("comment_id", targetId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((report: { reporter_id: string }) => report.reporter_id).filter(Boolean)).size;
}

async function autoDeleteTargetIfNeeded(
  supabase: any,
  moderatorId: string,
  report: { target_type: string; post_id: string | null; comment_id: string | null },
  resolution: string,
  threshold: number,
) {
  if (report.target_type !== "post" && report.target_type !== "comment") return null;

  const targetType = report.target_type as "post" | "comment";
  const targetId = targetType === "post" ? report.post_id : report.comment_id;
  if (!targetId) return null;

  const approvedCount = await countResolvedReportsFromDifferentUsers(supabase, targetType, targetId);
  if (approvedCount < threshold) return { deleted: false, approvedCount };

  if (targetType === "post") {
    const { data: post, error: readError } = await supabase
      .from("posts")
      .select("id,author_id,title")
      .eq("id", targetId)
      .maybeSingle();

    if (readError) throw new Error(readError.message);
    if (!post) return { deleted: false, approvedCount };

    const { error: logError } = await supabase.from("moderation_logs").insert({
      moderator_id: moderatorId,
      target_type: "post",
      post_id: targetId,
      action: "auto_delete_after_reports",
      reason: resolution || `Автоудаление: ${threshold} подтверждённых жалоб от разных пользователей`,
    });
    if (logError) throw new Error(logError.message);

    const { error: deleteError } = await supabase.from("posts").delete().eq("id", targetId);
    if (deleteError) throw new Error(deleteError.message);

    await supabase.from("notifications").insert({
      user_id: post.author_id,
      title: "Решение модерации: публикация удалена",
      body: `Публикация «${post.title}» удалена: достигнут порог ${threshold} одобренных жалоб.`,
      type: "moderation",
      metadata: { decision: "deleted", approved_reports_count: approvedCount, target_type: "post", target_title: post.title },
    });

    return { deleted: true, approvedCount };
  }

  const { data: comment, error: readError } = await supabase
    .from("comments")
    .select("id,post_id,user_id,body")
    .eq("id", targetId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!comment) return { deleted: false, approvedCount };

  const { error: logError } = await supabase.from("moderation_logs").insert({
    moderator_id: moderatorId,
    target_type: "comment",
    action: "auto_delete_after_reports",
    reason: resolution || `Автоудаление: ${threshold} подтверждённых жалоб от разных пользователей`,
  });
  if (logError) throw new Error(logError.message);

  const { error: deleteError } = await supabase.from("comments").delete().eq("id", targetId);
  if (deleteError) throw new Error(deleteError.message);

  await supabase.from("notifications").insert({
    user_id: comment.user_id,
    title: "Решение модерации: комментарий удалён",
    body: `Комментарий удалён: достигнут порог ${threshold} одобренных жалоб.`,
    type: "moderation",
    metadata: { decision: "deleted", approved_reports_count: approvedCount, target_type: "comment" },
  });

  revalidatePath(`/app/post/${comment.post_id}`);
  return { deleted: true, approvedCount };
}

export async function resolveReportAction(formData: FormData) {
  const { user, supabase } = await requireModerator();
  const rules = await getContentRules(supabase);
  const report_id = String(formData.get("report_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const resolution = String(formData.get("resolution") ?? "").trim();

  if (!report_id || !REPORT_STATUSES.has(status)) moderatorError("/moderator/reports", "Некорректное решение по жалобе");

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id,target_type,post_id,comment_id")
    .eq("id", report_id)
    .single();

  if (reportError || !report) moderatorError("/moderator/reports", `Жалоба не найдена: ${reportError?.message || "нет данных"}`);
  const reportData = report!;

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

  let autoDeleteResult: { deleted: boolean; approvedCount: number } | null = null;
  if (status === "resolved") {
    try {
      autoDeleteResult = await autoDeleteTargetIfNeeded(supabase, user.id, reportData, resolution, rules.auto_hide_report_threshold);
    } catch (error) {
      moderatorError(
        "/moderator/reports",
        `Жалоба подтверждена, но автоудаление не выполнено: ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
      );
    }
  }

  if (status === "resolved" && autoDeleteResult && !autoDeleteResult.deleted) {
    let targetOwnerId: string | null = null;
    let targetLabel = reportData.target_type === "post" ? "публикацию" : "комментарий";
    if (reportData.target_type === "post" && reportData.post_id) {
      const { data: target } = await supabase.from("posts").select("author_id,title").eq("id", reportData.post_id).maybeSingle();
      targetOwnerId = target?.author_id ?? null;
      if (target?.title) targetLabel = `публикацию «${target.title}»`;
    } else if (reportData.target_type === "comment" && reportData.comment_id) {
      const { data: target } = await supabase.from("comments").select("user_id").eq("id", reportData.comment_id).maybeSingle();
      targetOwnerId = target?.user_id ?? null;
    }
    if (targetOwnerId) {
      await supabase.from("notifications").insert({
        user_id: targetOwnerId,
        title: "Решение модерации по жалобе",
        body: `Жалоба на ${targetLabel} одобрена. Решение: предупреждение.${resolution ? ` Комментарий модератора: ${resolution}` : ""}`,
        type: "moderation",
        metadata: { decision: "warning", approved_reports_count: autoDeleteResult.approvedCount, target_type: reportData.target_type },
      });
    }
  }

  revalidatePath("/moderator");
  revalidatePath("/moderator/reports");
  if (reportData.post_id) revalidatePath(`/app/post/${reportData.post_id}`);

  const baseMessage = status === "resolved" ? "Жалоба подтверждена" : status === "rejected" ? "Жалоба отклонена" : "Жалоба взята в работу";
  const autoMessage = autoDeleteResult?.deleted
    ? ` Цель удалена автоматически: ${autoDeleteResult.approvedCount} подтверждённые жалобы от разных пользователей.`
    : autoDeleteResult
      ? ` Подтверждённых жалоб от разных пользователей: ${autoDeleteResult.approvedCount}/${rules.auto_hide_report_threshold}.`
      : "";

  redirectWithParams("/moderator/reports", { message: `${baseMessage}.${autoMessage}` });
}

export async function moderateCommentAction(formData: FormData) {
  const { user, supabase } = await requireModerator();
  const comment_id = String(formData.get("comment_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!comment_id || !["hide", "restore", "delete"].includes(action)) moderatorError("/moderator/comments", "Некорректное действие с комментарием");

  const { data: comment, error: readError } = await supabase.from("comments").select("id,post_id,user_id,body").eq("id", comment_id).single();
  if (readError || !comment) moderatorError("/moderator/comments", `Комментарий не найден: ${readError?.message || "нет данных"}`);
  const commentData = comment!;

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
    user_id: commentData.user_id,
    title: "Решение по комментарию",
    body: action === "hide" ? `Ваш комментарий скрыт. ${reason}` : action === "restore" ? "Ваш комментарий восстановлен" : `Ваш комментарий удалён. ${reason}`,
  });

  revalidatePath("/moderator/comments");
  revalidatePath(`/app/post/${commentData.post_id}`);
  redirectWithParams("/moderator/comments", { message: action === "hide" ? "Комментарий скрыт" : action === "restore" ? "Комментарий восстановлен" : "Комментарий удалён" });
}
