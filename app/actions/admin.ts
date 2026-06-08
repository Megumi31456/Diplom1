"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

const ROLES = new Set(["user", "moderator", "admin"]);
const STATUSES = new Set(["active", "blocked"]);

function adminError(path: string, message: string) {
  redirectWithParams(path, { error: message });
}

export async function updateUserRoleAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const target_user_id = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!target_user_id || !ROLES.has(role)) adminError("/admin/users", "Некорректные данные для изменения роли");

  const { error: updateError } = await supabase.from("profiles").update({ role }).eq("id", target_user_id);
  if (updateError) adminError("/admin/users", updateError.message);

  await supabase.from("admin_audit_logs").insert({ admin_id: user.id, action: "update_role", target_user_id, details: { role } });
  revalidatePath("/admin/users");
  redirectWithParams("/admin/users", { message: "Роль пользователя обновлена" });
}

export async function updateUserStatusAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const target_user_id = String(formData.get("user_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!target_user_id || !STATUSES.has(status)) adminError("/admin/users", "Некорректные данные для изменения статуса");

  const { error: updateError } = await supabase.from("profiles").update({ status }).eq("id", target_user_id);
  if (updateError) adminError("/admin/users", updateError.message);

  await supabase.from("admin_audit_logs").insert({ admin_id: user.id, action: "update_status", target_user_id, details: { status } });
  revalidatePath("/admin/users");
  redirectWithParams("/admin/users", { message: "Статус пользователя обновлён" });
}

export async function createCategoryAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) adminError("/admin/categories", "Введите название категории");

  const { error: insertError } = await supabase.from("categories").insert({ name });
  if (insertError) adminError("/admin/categories", insertError.message);

  await supabase.from("admin_audit_logs").insert({ admin_id: user.id, action: "create_category", details: { name } });
  revalidatePath("/admin/categories");
  redirectWithParams("/admin/categories", { message: "Категория создана" });
}

export async function updateCategoryAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const category_id = String(formData.get("category_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const is_active = formData.get("is_active") === "on";

  if (!category_id || !name) adminError("/admin/categories", "Некорректные данные категории");

  const { error } = await supabase.from("categories").update({ name, is_active }).eq("id", category_id);
  if (error) adminError("/admin/categories", error.message);

  await supabase.from("admin_audit_logs").insert({ admin_id: user.id, action: "update_category", details: { category_id, name, is_active } });
  revalidatePath("/admin/categories");
  redirectWithParams("/admin/categories", { message: "Категория обновлена" });
}

export async function updateSettingsAction(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const max_upload_mb = Number(formData.get("max_upload_mb") ?? 20);
  const allowed_formats = String(formData.get("allowed_formats") ?? "jpg,png,gif,mp4,pdf,txt").split(",").map((x) => x.trim()).filter(Boolean);
  const auto_hide_report_threshold = Number(formData.get("auto_hide_report_threshold") ?? 5);
  const publication_premoderation = formData.get("publication_premoderation") === "on";

  const value = { max_upload_mb, allowed_formats, auto_hide_report_threshold, publication_premoderation };
  const { error } = await supabase.from("platform_settings").upsert({ key: "content_rules", value, updated_by: user.id });
  if (error) adminError("/admin/settings", error.message);

  await supabase.from("admin_audit_logs").insert({ admin_id: user.id, action: "update_settings", details: value });
  revalidatePath("/admin/settings");
  redirectWithParams("/admin/settings", { message: "Настройки сохранены" });
}
