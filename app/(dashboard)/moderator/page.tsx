import Link from "next/link";
import { requireModerator } from "@/lib/auth";
import { moderatePostAction } from "@/app/actions/moderation";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function ModeratorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireModerator();

  const pendingCountQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const reportsCountQuery = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  const postsQuery = supabase
    .from("posts")
    .select("id,title,description,media_url,type,visibility,tags,status,created_at,author_id,category_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  const [{ count: pending }, { count: reports }, { data: posts, error: postsError }] = await Promise.all([
    pendingCountQuery,
    reportsCountQuery,
    postsQuery,
  ]);

  return (
    <div>
      <h1 className="text-4xl font-black">Панель модератора</h1>

      {params.message && (
        <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>
      )}

      {params.error && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>
      )}

      {postsError && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">
          Ошибка загрузки очереди публикаций: {postsError.message}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card">
          <p className="text-slate-400">Ожидают проверки</p>
          <b className="text-4xl">{pending || 0}</b>
        </div>

        <Link href="/moderator/reports" className="card block">
          <p className="text-slate-400">Открытые жалобы</p>
          <b className="text-4xl">{reports || 0}</b>
        </Link>

        <Link href="/moderator/comments" className="card block">
          <p className="text-slate-400">Комментарии</p>
          <b className="text-4xl">→</b>
        </Link>

        <Link href="/moderator/logs" className="card block">
          <p className="text-slate-400">Журнал</p>
          <b className="text-4xl">→</b>
        </Link>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Очередь публикаций</h2>
          <p className="mt-1 text-sm text-slate-400">
            Здесь отображаются публикации со статусом pending. Можно одобрить, скрыть, отклонить или вернуть на доработку.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {posts?.length ? (
          posts.map((post) => (
            <article className="card" key={post.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">{post.type}</span>
                    <span className="badge">{post.visibility}</span>
                    <span className="badge">{post.status}</span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">{post.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{post.description}</p>

                  {post.media_url && (
                    <a
                      href={post.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      Открыть прикреплённый материал →
                    </a>
                  )}

                  {post.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag: string) => (
                        <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400 lg:w-56">
                  <p>ID публикации:</p>
                  <p className="mt-1 break-all text-slate-300">{post.id}</p>
                </div>
              </div>

              <form action={moderatePostAction} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
                <input type="hidden" name="post_id" value={post.id} />
                <input className="input" name="reason" placeholder="Причина решения / комментарий модератора" />
                <button name="action" value="approve" className="btn-primary" type="submit">
                  Одобрить
                </button>
                <button name="action" value="hide" className="btn-secondary" type="submit">
                  Скрыть
                </button>
                <button name="action" value="reject" className="btn-secondary" type="submit">
                  Отклонить
                </button>
                <button name="action" value="revise" className="btn-secondary" type="submit">
                  На доработку
                </button>
                <button name="action" value="duplicate" className="btn-secondary" type="submit">
                  Дубликат
                </button>
              </form>
            </article>
          ))
        ) : (
          !postsError && (
            <div className="card text-slate-400">
              Очередь пуста. Новые публичные публикации появятся здесь после создания пользователями.
            </div>
          )
        )}
      </div>
    </div>
  );
}
