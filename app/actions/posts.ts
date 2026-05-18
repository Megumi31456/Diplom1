"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

const POST_TYPES = new Set(["text", "image", "video", "link"]);
const VISIBILITIES = new Set(["public", "private"]);
const POST_STATUSES = new Set(["draft", "pending"]);

function arr(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function postError(message: string, path = "/app/create") {
  redirectWithParams(path, { error: message });
}

export async function createPostAction(formData: FormData) {
  const { user, profile, supabase } = await requireUser();

  if (!profile) postError("Профиль пользователя не найден. Выйдите из аккаунта и войдите снова.");
  if (profile.status === "blocked") postError("Ваш аккаунт заблокирован. Создание публикаций недоступно.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const media_url = String(formData.get("media_url") ?? "").trim() || null;
  const rawType = String(formData.get("type") ?? "text");
  const rawVisibility = String(formData.get("visibility") ?? "public");
  const rawStatus = String(formData.get("status") ?? "pending");
  const type = POST_TYPES.has(rawType) ? rawType : "text";
  const visibility = VISIBILITIES.has(rawVisibility) ? rawVisibility : "public";
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const tags = arr(formData.get("tags"));
  const status = rawStatus === "draft" ? "draft" : visibility === "private" ? "published" : "pending";

  if (!title || !description) postError("Укажите название и описание публикации");
  if (!POST_STATUSES.has(rawStatus) && rawStatus) postError("Некорректный статус публикации");

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    title,
    description,
    media_url,
    type,
    visibility,
    category_id,
    tags,
    status,
  });

  if (error) postError(error.message);

  revalidatePath("/app");
  revalidatePath("/moderator");
  redirectWithParams(status === "draft" ? "/app/profile" : "/app", {
    message:
      status === "draft"
        ? "Черновик сохранён"
        : visibility === "private"
          ? "Приватная публикация создана"
          : "Публикация создана и отправлена на проверку",
  });
}

export async function updatePostAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const media_url = String(formData.get("media_url") ?? "").trim() || null;
  const rawType = String(formData.get("type") ?? "text");
  const rawVisibility = String(formData.get("visibility") ?? "public");
  const type = POST_TYPES.has(rawType) ? rawType : "text";
  const visibility = VISIBILITIES.has(rawVisibility) ? rawVisibility : "public";
  const category_id = String(formData.get("category_id") ?? "").trim() || null;
  const tags = arr(formData.get("tags"));
  const submit = String(formData.get("submit") ?? "save");
  const status = submit === "publish" && visibility === "public" ? "pending" : submit === "publish" ? "published" : "draft";

  if (!post_id) postError("Публикация не найдена", "/app/profile");
  if (!title || !description) postError("Укажите название и описание публикации", `/app/post/${post_id}/edit`);

  const { error } = await supabase
    .from("posts")
    .update({ title, description, media_url, type, visibility, category_id, tags, status, moderation_note: null })
    .eq("id", post_id)
    .eq("author_id", user.id);

  if (error) postError(error.message, `/app/post/${post_id}/edit`);

  revalidatePath("/app");
  revalidatePath(`/app/post/${post_id}`);
  revalidatePath("/moderator");
  redirectWithParams(`/app/post/${post_id}`, { message: status === "pending" ? "Публикация отправлена на проверку" : "Публикация обновлена" });
}

export async function deletePostAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  if (!post_id) redirectWithParams("/app/profile", { error: "Публикация не найдена" });

  const { error } = await supabase.from("posts").delete().eq("id", post_id).eq("author_id", user.id);
  if (error) redirectWithParams(`/app/post/${post_id}`, { error: error.message });

  revalidatePath("/app");
  revalidatePath("/app/profile");
  redirectWithParams("/app/profile", { message: "Публикация удалена" });
}

export async function toggleLikeAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const next = String(formData.get("next") ?? `/app/post/${post_id}`);
  if (!post_id) return;

  const { data: existing } = await supabase.from("likes").select("post_id").eq("post_id", post_id).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from("likes").delete().eq("post_id", post_id).eq("user_id", user.id);
  else await supabase.from("likes").insert({ post_id, user_id: user.id });

  revalidatePath("/app");
  revalidatePath(`/app/post/${post_id}`);
  redirectWithParams(next, { message: existing ? "Лайк убран" : "Публикация оценена" });
}

export async function commentAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!post_id || !body) redirectWithParams(`/app/post/${post_id}`, { error: "Введите текст комментария" });

  const { error } = await supabase.from("comments").insert({ post_id, user_id: user.id, body });
  if (error) redirectWithParams(`/app/post/${post_id}`, { error: error.message });

  revalidatePath(`/app/post/${post_id}`);
  redirectWithParams(`/app/post/${post_id}`, { message: "Комментарий добавлен" });
}

export async function reportPostAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!post_id || !reason) redirectWithParams(`/app/post/${post_id}`, { error: "Не указана причина жалобы" });

  const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: "post", post_id, reason, details });
  if (error) redirectWithParams(`/app/post/${post_id}`, { error: error.message });

  revalidatePath("/moderator/reports");
  redirectWithParams(`/app/post/${post_id}`, { message: "Жалоба отправлена" });
}

export async function reportCommentAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const comment_id = String(formData.get("comment_id") ?? "").trim();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!comment_id || !post_id || !reason) redirectWithParams(`/app/post/${post_id}`, { error: "Не указана причина жалобы" });

  const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: "comment", comment_id, reason });
  if (error) redirectWithParams(`/app/post/${post_id}`, { error: error.message });

  revalidatePath("/moderator/reports");
  redirectWithParams(`/app/post/${post_id}`, { message: "Жалоба на комментарий отправлена" });
}
