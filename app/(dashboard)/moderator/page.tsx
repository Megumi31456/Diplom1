import Link from "next/link";
import { requireModerator } from "@/lib/auth";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function ModeratorPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { supabase } = await requireModerator();

  const reportsCountQuery = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  const inProgressCountQuery = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_progress");

  const resolvedCountQuery = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "resolved");

  const recentReportsQuery = supabase
    .from("reports")
    .select("id,target_type,post_id,comment_id,reason,status,created_at")
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(10);

  const [
    { count: openReports },
    { count: inProgressReports },
    { count: resolvedReports },
    { data: recentReports, error: reportsError },
  ] = await Promise.all([reportsCountQuery, inProgressCountQuery, resolvedCountQuery, recentReportsQuery]);

  return (
    <div>
      <h1 className="text-4xl font-black">Панель модератора</h1>
      <p className="mt-2 text-slate-400">
        Новые публикации теперь публикуются сразу. В модерацию попадают только материалы, на которые пришли жалобы.
      </p>

      {params.message && (
        <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>
      )}

      {params.error && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>
      )}

      {reportsError && (
        <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">
          Ошибка загрузки жалоб: {reportsError.message}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Link href="/moderator/reports" className="card block">
          <p className="text-slate-400">Открытые жалобы</p>
          <b className="text-4xl">{openReports || 0}</b>
        </Link>

        <Link href="/moderator/reports" className="card block">
          <p className="text-slate-400">В работе</p>
          <b className="text-4xl">{inProgressReports || 0}</b>
        </Link>

        <Link href="/moderator/reports" className="card block">
          <p className="text-slate-400">Подтверждено</p>
          <b className="text-4xl">{resolvedReports || 0}</b>
        </Link>

        <Link href="/moderator/logs" className="card block">
          <p className="text-slate-400">Журнал</p>
          <b className="text-4xl">→</b>
        </Link>
      </div>

      <div className="mt-10 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Актуальные жалобы</h2>
          <p className="mt-1 text-sm text-slate-400">
            После 3 подтверждённых жалоб от разных пользователей публикация или комментарий удаляются автоматически.
          </p>
        </div>
        <Link className="btn-secondary" href="/moderator/reports">Открыть все жалобы</Link>
      </div>

      <div className="mt-4 space-y-4">
        {recentReports?.length ? (
          recentReports.map((report) => (
            <article className="card" key={report.id}>
              <div className="flex flex-wrap gap-2">
                <span className="badge">{report.status}</span>
                <span className="badge">{report.target_type}</span>
              </div>
              <h3 className="mt-4 text-xl font-black">{report.reason}</h3>
              <p className="mt-2 text-sm text-slate-400">
                {report.target_type === "post" ? `Публикация: ${report.post_id}` : `Комментарий: ${report.comment_id}`}
              </p>
              <Link className="mt-4 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200" href="/moderator/reports">
                Рассмотреть жалобу →
              </Link>
            </article>
          ))
        ) : (
          !reportsError && <div className="card text-slate-400">Открытых жалоб пока нет.</div>
        )}
      </div>
    </div>
  );
}
