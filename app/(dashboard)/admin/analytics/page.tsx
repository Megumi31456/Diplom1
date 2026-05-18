import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [users, posts, reports, categories, moderators] = await Promise.all([
    supabase.from("profiles").select("id,created_at,role,status"),
    supabase.from("posts").select("id,created_at,status,category_id,likes_count,comments_count"),
    supabase.from("reports").select("id,created_at,status"),
    supabase.from("categories").select("id,name"),
    supabase.from("moderation_logs").select("id,moderator_id,action,created_at,profiles!moderation_logs_moderator_id_fkey(full_name)").limit(100),
  ]);
  const categoryMap = new Map((categories.data ?? []).map((c: any) => [c.id, c.name]));
  const topCategories = Object.entries((posts.data ?? []).reduce((acc: any, p: any) => { const name = categoryMap.get(p.category_id) || "Без категории"; acc[name] = (acc[name] || 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10);

  return (
    <div>
      <h1 className="text-4xl font-black">Аналитика и отчётность</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="card"><p className="text-slate-400">Регистрации</p><b className="text-4xl">{users.data?.length || 0}</b></div>
        <div className="card"><p className="text-slate-400">Публикации</p><b className="text-4xl">{posts.data?.length || 0}</b></div>
        <div className="card"><p className="text-slate-400">Жалобы</p><b className="text-4xl">{reports.data?.length || 0}</b></div>
        <div className="card"><p className="text-slate-400">Действия модерации</p><b className="text-4xl">{moderators.data?.length || 0}</b></div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card"><h2 className="text-2xl font-black">Популярные категории</h2><div className="mt-4 space-y-3">{topCategories.map(([name, count]: any) => <div key={name} className="flex justify-between rounded-2xl bg-white/5 p-3"><span>{name}</span><b>{count}</b></div>)}</div></div>
        <div className="card"><h2 className="text-2xl font-black">Последние действия модераторов</h2><div className="mt-4 space-y-3">{moderators.data?.slice(0, 10).map((l: any) => <div key={l.id} className="rounded-2xl bg-white/5 p-3"><p className="font-bold">{l.action}</p><p className="text-sm text-slate-400">{l.profiles?.full_name} · {new Date(l.created_at).toLocaleString("ru-RU")}</p></div>)}</div></div>
      </div>
    </div>
  );
}
