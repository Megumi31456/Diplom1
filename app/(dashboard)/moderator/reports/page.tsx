import { requireModerator } from "@/lib/auth";
import { resolveReportAction } from "@/app/actions/moderation";

type SearchParams = Promise<{ error?: string; message?: string }>;

function targetKey(report: { target_type: string; post_id: string | null; comment_id: string | null }) {
  return `${report.target_type}:${report.target_type === "post" ? report.post_id : report.comment_id}`;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireModerator();

  const { data, error } = await supabase
    .from("reports")
    .select("id,target_type,post_id,comment_id,reason,details,status,resolution,created_at,reporter_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const reports = data ?? [];
  const postIds = [...new Set(reports.map((report) => report.post_id).filter(Boolean))] as string[];
  const commentIds = [...new Set(reports.map((report) => report.comment_id).filter(Boolean))] as string[];

  const [{ data: posts }, { data: comments }, { data: resolvedReports }] = await Promise.all([
    postIds.length
      ? supabase.from("posts").select("id,title,status").in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; title: string; status: string }[] }),
    commentIds.length
      ? supabase.from("comments").select("id,body,post_id,post:posts!comments_post_id_fkey(title,status)").in("id", commentIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("reports").select("target_type,post_id,comment_id,reporter_id").eq("status", "resolved"),
  ]);

  const postById = new Map((posts ?? []).map((post) => [post.id, post]));
  const commentById = new Map((comments ?? []).map((comment: any) => [comment.id, comment]));
  const approvedReportersByTarget = new Map<string, Set<string>>();

  for (const report of resolvedReports ?? []) {
    const key = targetKey(report as any);
    if (!key.includes("null")) {
      if (!approvedReportersByTarget.has(key)) approvedReportersByTarget.set(key, new Set());
      approvedReportersByTarget.get(key)?.add((report as any).reporter_id);
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-black">Жалобы</h1>
      <p className="mt-2 text-slate-400">
        Подтверждение жалобы засчитывается к цели. После 3 подтверждённых жалоб от разных пользователей цель удаляется автоматически.
      </p>

      {params.message && (
        <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>
      )}

      {params.error && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>
      )}

      {error && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">
          Ошибка загрузки жалоб: {error.message}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {reports.length ? (
          reports.map((report) => {
            const post = report.post_id ? postById.get(report.post_id) : null;
            const comment = report.comment_id ? commentById.get(report.comment_id) : null;
            const approvedCount = approvedReportersByTarget.get(targetKey(report))?.size ?? 0;
            const isClosed = report.status === "resolved" || report.status === "rejected";

            return (
              <article className="card" key={report.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge">{report.status}</span>
                      <span className="badge">{report.target_type}</span>
                      <span className="badge">подтверждено: {approvedCount}/3</span>
                    </div>

                    <h2 className="mt-4 text-xl font-black">{report.reason}</h2>
                    {report.target_type === "post" ? (
                      <p className="mt-1 text-sm text-slate-400">
                        Публикация: {post?.title || "—"} {post?.status ? `· статус: ${post.status}` : ""}
                      </p>
                    ) : (
                      <div className="mt-1 text-sm text-slate-400">
                        <p>Комментарий к публикации: {comment?.post?.title || "—"}</p>
                        {comment?.body && <p className="mt-2 rounded-2xl bg-white/5 p-3 text-slate-300">{comment.body}</p>}
                      </div>
                    )}

                    {report.details && <p className="mt-3 whitespace-pre-line text-slate-300">{report.details}</p>}
                    {report.resolution && <p className="mt-3 text-sm text-cyan-200">Решение: {report.resolution}</p>}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-400 md:w-56">
                    <p>ID жалобы:</p>
                    <p className="mt-1 break-all text-slate-300">{report.id}</p>
                  </div>
                </div>

                {!isClosed && (
                  <form action={resolveReportAction} className="mt-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <input type="hidden" name="report_id" value={report.id} />
                    <input className="input max-w-md" name="resolution" placeholder="Решение по жалобе" />
                    <button name="status" value="resolved" className="btn-primary" type="submit">
                      Подтвердить
                    </button>
                    <button name="status" value="rejected" className="btn-secondary" type="submit">
                      Отклонить
                    </button>
                    <button name="status" value="in_progress" className="btn-secondary" type="submit">
                      В работу
                    </button>
                  </form>
                )}
              </article>
            );
          })
        ) : (
          !error && <div className="card text-slate-400">Жалоб пока нет.</div>
        )}
      </div>
    </div>
  );
}
