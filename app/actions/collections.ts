"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { redirectWithParams } from "@/lib/redirect";

export async function createCollectionAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_private = formData.get("is_private") === "on";

  if (!title) redirectWithParams("/app/collections", { error: "Введите название коллекции" });

  const { error } = await supabase.from("collections").insert({ owner_id: user.id, title, description, is_private });
  if (error) redirectWithParams("/app/collections", { error: error.message });

  revalidatePath("/app/collections");
  redirectWithParams("/app/collections", { message: "Коллекция создана" });
}

export async function updateCollectionAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const collection_id = String(formData.get("collection_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_private = formData.get("is_private") === "on";

  if (!collection_id || !title) redirectWithParams("/app/collections", { error: "Некорректные данные коллекции" });

  const { error } = await supabase.from("collections").update({ title, description, is_private }).eq("id", collection_id).eq("owner_id", user.id);
  if (error) redirectWithParams(`/app/collections/${collection_id}`, { error: error.message });

  revalidatePath("/app/collections");
  revalidatePath(`/app/collections/${collection_id}`);
  redirectWithParams(`/app/collections/${collection_id}`, { message: "Коллекция обновлена" });
}

export async function deleteCollectionAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const collection_id = String(formData.get("collection_id") ?? "").trim();
  if (!collection_id) redirectWithParams("/app/collections", { error: "Коллекция не найдена" });

  const { error } = await supabase.from("collections").delete().eq("id", collection_id).eq("owner_id", user.id);
  if (error) redirectWithParams(`/app/collections/${collection_id}`, { error: error.message });

  revalidatePath("/app/collections");
  redirectWithParams("/app/collections", { message: "Коллекция удалена" });
}

export async function addPostToCollectionAction(formData: FormData) {
  const { supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const collection_id = String(formData.get("collection_id") ?? "").trim();

  if (!post_id || !collection_id) redirectWithParams(`/app/post/${post_id}`, { error: "Выберите коллекцию" });

  const { error } = await supabase.from("collection_items").upsert({ collection_id, post_id });
  if (error) redirectWithParams(`/app/post/${post_id}`, { error: error.message });

  revalidatePath("/app/collections");
  revalidatePath(`/app/collections/${collection_id}`);
  redirectWithParams(`/app/post/${post_id}`, { message: "Публикация сохранена в коллекцию" });
}

export async function removePostFromCollectionAction(formData: FormData) {
  const { supabase } = await requireUser();
  const post_id = String(formData.get("post_id") ?? "").trim();
  const collection_id = String(formData.get("collection_id") ?? "").trim();

  if (!post_id || !collection_id) redirectWithParams("/app/collections", { error: "Элемент коллекции не найден" });

  const { error } = await supabase.from("collection_items").delete().eq("collection_id", collection_id).eq("post_id", post_id);
  if (error) redirectWithParams(`/app/collections/${collection_id}`, { error: error.message });

  revalidatePath(`/app/collections/${collection_id}`);
  redirectWithParams(`/app/collections/${collection_id}`, { message: "Публикация удалена из коллекции" });
}
