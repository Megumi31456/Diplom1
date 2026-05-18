"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function redirectWithParams(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  redirect(`${path}?${searchParams.toString()}`);
}

function authError(path: "/login" | "/register", message: string) {
  redirectWithParams(path, { error: message });
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) {
    authError("/register", "Заполните все поля формы");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/app`,
    },
  });

  if (error) {
    authError("/register", error.message);
  }

  redirectWithParams("/login", {
    message: "Аккаунт создан. Проверьте почту или войдите, если подтверждение отключено",
  });
}

export async function signInAction(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    authError("/login", "Введите email и пароль");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authError("/login", error.message);
  }

  redirect("/app");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
