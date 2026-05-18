import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addPostToCollectionAction } from "@/app/actions/collections";
import { commentAction, deleteCommentAction, deletePostAction, reportCommentAction, reportPostAction, toggleLikeAction } from "@/app/actions/posts";
import { POST_CARD_SELECT } from "@/lib/queries";
import { getLikesCount } from "@/lib/post-counts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> };

export default async function PostPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, supabase } = await requireUser();

  const [{ data: post, error }, { data: comments }, { data: collections }, { data: liked }] = await Promise.all([
    supabase.from("posts").select(POST_CARD_SELECT + ", moderation_note").eq("id", id).single(),
    supabase.from("comments").select("id,body,is_hidden,created_at,user_id,author:profiles!comments_user_id_fkey(id,full_name,avatar_url)").eq("post_id", id).order("created_at", { ascending: true }),
    supabase.from("collections").select("id,title").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle(),
  ]);

  if (error || !post) notFound();
  const postData = post as any;
  const author = postData.author;
  const isOwner = postData.author_id === user.id;
  const likesCount = getLikesCount(postData);

  return (
    <div className="mx-auto max-w-4xl">
      {sp.message && <p className="mb-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mb-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}

      <article className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="badge">{postData.type}</span>
              <span className="badge">{postData.status}</span>
              <span className="badge">{postData.visibility}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black">{postData.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              Автор: <Link className="text-cyan-200 hover:text-white" href={`/app/profile/${author?.id || postData.author_id}`}>{author?.full_name || "Автор"}</Link>
              {postData.category?.name ? ` · ${postData.category.name}` : ""}
            </p>
          </div>
          {isOwner && <Link className="btn-secondary" href={`/app/post/${postData.id}/edit`}>Редактировать</Link>}
        </div>

        {postData.media_url && postData.type === "image" && <img src={postData.media_url} alt="" className="mt-6 max-h-[620px] w-full rounded-3xl border border-white/10 object-contain" />}
        {postData.media_url && postData.type !== "image" && <a href={postData.media_url} target="_blank" rel="noreferrer" className="mt-6 inline-block text-cyan-300 hover:text-cyan-100">Открыть материал →</a>}

        <p className="mt-6 whitespace-pre-line text-slate-200">{postData.description}</p>
        {postData.moderation_note && <p className="mt-6 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100">Комментарий модерации: {postData.moderation_note}</p>}
        {postData.tags?.length ? <div className="mt-6 flex flex-wrap gap-2">{postData.tags.map((tag: string) => <span className="badge" key={tag}>#{tag}</span>)}</div> : null}

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <form action={toggleLikeAction}>
            <input type="hidden" name="post_id" value={postData.id} />
            <input type="hidden" name="next" value={`/app/post/${postData.id}`} />
            <button className="btn-primary w-full">{liked ? "Убрать лайк" : "Лайк"} · {likesCount}</button>
          </form>

          <form id="save" action={addPostToCollectionAction} className="flex gap-2 md:col-span-2">
            <input type="hidden" name="post_id" value={postData.id} />
            <select className="input" name="collection_id" required>
              <option value="">Сохранить в коллекцию</option>
              {collections?.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button className="btn-secondary">Сохранить</button>
          </form>
        </div>

        <form action={reportPostAction} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="post_id" value={postData.id} />
          <input className="input" name="reason" placeholder="Причина жалобы" />
          <input className="input" name="details" placeholder="Пояснение" />
          <button className="btn-secondary">Пожаловаться</button>
        </form>

        {isOwner && (
          <form action={deletePostAction} className="mt-4">
            <input type="hidden" name="post_id" value={postData.id} />
            <button className="text-sm text-red-300 underline">Удалить публикацию</button>
          </form>
        )}
      </article>

      <section className="mt-8">
        <h2 className="text-2xl font-black">Комментарии</h2>
        <form action={commentAction} className="card mt-4 flex gap-3">
          <input type="hidden" name="post_id" value={postData.id} />
          <input className="input" name="body" placeholder="Написать комментарий" required />
          <button className="btn-primary">Отправить</button>
        </form>

        <div className="mt-4 space-y-3">
          {comments?.map((comment: any) => (
            <div className="card" key={comment.id}>
              <p className="text-sm text-slate-400">{comment.author?.full_name || "Пользователь"} · {new Date(comment.created_at).toLocaleString("ru-RU")}</p>
              <p className="mt-2 text-slate-200">{comment.is_hidden ? "Комментарий скрыт модератором" : comment.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {!comment.is_hidden && (
                  <form action={reportCommentAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="post_id" value={postData.id} />
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <input className="input max-w-xs" name="reason" placeholder="Причина жалобы" />
                    <button className="btn-secondary">Пожаловаться</button>
                  </form>
                )}
                {comment.user_id === user.id && (
                  <form action={deleteCommentAction}>
                    <input type="hidden" name="post_id" value={postData.id} />
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <button className="rounded-xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Удалить</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {!comments?.length && <div className="card text-slate-400">Комментариев пока нет.</div>}
        </div>
      </section>
    </div>
  );
}
