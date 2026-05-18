import { requireModerator } from "@/lib/auth";
import { moderateCommentAction } from "@/app/actions/moderation";

export const dynamic = "force-dynamic";

export default async function ModeratorCommentsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("comments")
    .select("id,body,is_hidden,created_at,post_id,user_id,author:profiles!comments_user_id_fkey(full_name),post:posts!comments_post_id_fkey(title,status)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-4xl font-black">Модерация комментариев</h1>
      <p className="mt-2 text-slate-400">Скрытие, удаление и восстановление комментариев с фиксацией решения.</p>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки комментариев: {error.message}</p>}

      <div className="mt-8 space-y-4">
        {data?.map((comment: any) => (
          <article className="card" key={comment.id}>
            <div className="flex flex-wrap gap-2"><span className="badge">{comment.is_hidden ? "hidden" : "visible"}</span><span className="badge">{comment.post?.status}</span></div>
            <h2 className="mt-4 font-black">{comment.author?.full_name || "Пользователь"}</h2>
            <p className="mt-1 text-sm text-slate-400">Публикация: {comment.post?.title || "—"}</p>
            <p className="mt-3 whitespace-pre-line text-slate-200">{comment.body}</p>
            <form action={moderateCommentAction} className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <input type="hidden" name="comment_id" value={comment.id} />
              <input className="input max-w-md" name="reason" placeholder="Причина решения" />
              <button name="action" value="hide" className="btn-secondary">Скрыть</button>
              <button name="action" value="restore" className="btn-secondary">Восстановить</button>
              <button name="action" value="delete" className="btn-secondary">Удалить</button>
            </form>
          </article>
        ))}
        {!data?.length && !error && <div className="card text-slate-400">Комментариев пока нет.</div>}
      </div>
    </div>
  );
}
