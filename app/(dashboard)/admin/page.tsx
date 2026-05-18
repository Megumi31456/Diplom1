import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [users, posts, reports, hidden, categories, moderators] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "hidden"),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "moderator"),
  ]);

  return (
    <div>
      <h1 className="text-4xl font-black">Административная панель</h1>
      <p className="mt-2 text-slate-400">Управление пользователями, ролями, справочниками, настройками и аудитом.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Пользователи", users.count], ["Публикации", posts.count], ["Жалобы", reports.count], ["Скрытые", hidden.count], ["Категории", categories.count], ["Модераторы", moderators.count]
        ].map(([t,v]) => <div className="card" key={t as string}><p className="text-slate-400">{t}</p><b className="text-4xl">{v || 0}</b></div>)}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <Link className="card block hover:bg-white/10" href="/admin/users">Пользователи и роли →</Link>
        <Link className="card block hover:bg-white/10" href="/admin/categories">Категории и теги →</Link>
        <Link className="card block hover:bg-white/10" href="/admin/settings">Системные настройки →</Link>
        <Link className="card block hover:bg-white/10" href="/admin/analytics">Аналитика →</Link>
        <Link className="card block hover:bg-white/10" href="/admin/audit">Журнал действий →</Link>
      </div>
    </div>
  );
}
