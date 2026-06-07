import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toggleFollowAction } from "@/app/actions/social";
import { sendMessageAction } from "@/app/actions/messages";
import { PostCard } from "@/components/PostCard";
import { POST_CARD_SELECT } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const [{ data: profile }, { data: posts }, followers, following, { data: isFollowed }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,bio,avatar_url,interests,role,created_at").eq("id", id).single(),
    supabase.from("posts").select(POST_CARD_SELECT).eq("author_id", id).eq("status", "published").eq("visibility", "public").order("created_at", { ascending: false }),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", id),
    supabase.from("follows").select("following_id").eq("follower_id", user.id).eq("following_id", id).maybeSingle(),
  ]);

  if (!profile) notFound();
  const isMe = user.id === id;

  return (
    <div>
      {sp.message && <p className="mb-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mb-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}

      <section className="card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-3xl object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-3xl bg-cyan-300 text-3xl font-black text-slate-950">{profile.full_name?.[0] || "U"}</div>}
            <div>
              <h1 className="text-4xl font-black">{profile.full_name}</h1>
              <p className="mt-1 text-slate-400">{profile.bio || "Автор пока не добавил описание"}</p>
            </div>
          </div>

          {!isMe ? (
            <div className="flex flex-wrap gap-3">
              <form action={toggleFollowAction}>
                <input type="hidden" name="following_id" value={id} />
                <input type="hidden" name="next" value={`/app/profile/${id}`} />
                <button className="btn-primary">{isFollowed ? "Отписаться" : "Подписаться"}</button>
              </form>
              <Link href={`/app/messages?to=${id}`} className="btn-secondary">Написать</Link>
            </div>
          ) : <Link href="/app/profile" className="btn-secondary">Редактировать мой профиль</Link>}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/5 p-4"><p className="text-slate-400">Публикации</p><b className="text-2xl">{posts?.length || 0}</b></div>
          <div className="rounded-2xl bg-white/5 p-4"><p className="text-slate-400">Подписчики</p><b className="text-2xl">{followers.count || 0}</b></div>
          <div className="rounded-2xl bg-white/5 p-4"><p className="text-slate-400">Подписки</p><b className="text-2xl">{following.count || 0}</b></div>
        </div>

        {profile.interests?.length ? <div className="mt-6 flex flex-wrap gap-2">{profile.interests.map((i: string) => <span className="badge" key={i}>#{i}</span>)}</div> : null}
      </section>

      <h2 className="mt-10 text-2xl font-black">Публикации автора</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {posts?.map((post: any) => <PostCard key={post.id} post={post} userId={user.id} next={`/app/profile/${id}`} />)}
      </div>
      {!posts?.length && <div className="card mt-4 text-slate-400">У автора пока нет публичных публикаций.</div>}

      {!isMe && (
        <form action={sendMessageAction} className="card mt-8 flex gap-3">
          <input type="hidden" name="recipient_id" value={id} />
          <input className="input" name="body" placeholder="Быстрое сообщение автору" required />
          <button className="btn-primary">Отправить</button>
        </form>
      )}
    </div>
  );
}
