import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { updateProfileAction } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, profile, supabase } = await requireUser();
  const [posts, followers, following, collections] = await Promise.all([
    supabase.from("posts").select("id,title,status,visibility,created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", user.id),
    supabase.from("collections").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
  ]);

  return (
    <div>
      <h1 className="text-4xl font-black">Профиль</h1>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action={updateProfileAction} className="card space-y-4">
          <h2 className="text-2xl font-black">Личные данные</h2>
          <input className="input" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Имя" required />
          <input className="input" name="avatar_url" defaultValue={profile?.avatar_url ?? ""} placeholder="Ссылка на аватар" />
          <textarea className="input min-h-28" name="bio" defaultValue={profile?.bio ?? ""} placeholder="Описание профиля" />
          <input className="input" name="interests" defaultValue={(profile?.interests ?? []).join(", ")} placeholder="Интересы через запятую: ui, фото, дизайн" />
          <button className="btn-primary">Сохранить профиль</button>
        </form>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card"><p className="text-slate-400">Публикации</p><b className="text-3xl">{posts.data?.length || 0}</b></div>
            <div className="card"><p className="text-slate-400">Подписчики</p><b className="text-3xl">{followers.count || 0}</b></div>
            <div className="card"><p className="text-slate-400">Подписки</p><b className="text-3xl">{following.count || 0}</b></div>
            <div className="card"><p className="text-slate-400">Коллекции</p><b className="text-3xl">{collections.count || 0}</b></div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black">Мои материалы</h2>
              <Link href="/app/create" className="btn-secondary">Создать</Link>
            </div>
            <div className="mt-4 space-y-3">
              {posts.data?.map((post: any) => (
                <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <Link href={`/app/post/${post.id}`} className="font-bold hover:text-cyan-200">{post.title}</Link>
                    <p className="mt-1 text-xs text-slate-400">{post.status} · {post.visibility}</p>
                  </div>
                  <Link className="btn-secondary" href={`/app/post/${post.id}/edit`}>Редактировать</Link>
                </div>
              ))}
              {!posts.data?.length && <p className="text-slate-400">Публикаций пока нет.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
