import { requireUser } from "@/lib/auth";
import { deleteAllReadNotificationsAction, deleteNotificationAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const hasUnread = data?.some((n: any) => !n.is_read);
  const hasRead = data?.some((n: any) => n.is_read);

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-4xl font-black">Уведомления</h1><p className="mt-2 text-slate-400">Комментарии, подписки и решения модерации.</p></div>
      <div className="flex flex-wrap gap-2">
        {hasUnread && <form action={markAllNotificationsReadAction}><button className="btn-secondary">Прочитать все</button></form>}
        {hasRead && <form action={deleteAllReadNotificationsAction}><button className="rounded-2xl border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Удалить прочитанные</button></form>}
      </div>
    </div>
    {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
    {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
    {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка уведомлений: {error.message}</p>}
    <div className="mt-8 space-y-3">
      {data?.map((n: any) => {
        const moderation = n.type === "moderation" || n.title?.toLowerCase().includes("модерац") || n.title?.toLowerCase().includes("жалоб");
        return <div className={`card ${n.is_read ? "opacity-70" : "border-blue-400/50 bg-blue-500/[0.06]"}`} key={n.id}>
          <div className="flex flex-wrap justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{n.title}</h2>{moderation && <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-200">Решение модерации</span>}</div>
              <p className="mt-1 text-sm text-slate-300">{n.body}</p>
              {n.metadata?.approved_reports_count != null && <p className="mt-2 text-sm font-semibold text-amber-200">Одобренных жалоб: {n.metadata.approved_reports_count}/3</p>}
              <p className="mt-2 text-xs text-slate-500">{new Date(n.created_at).toLocaleString("ru-RU")}</p>
            </div>
            <div className="flex items-start gap-2">
              {!n.is_read && <form action={markNotificationReadAction}><input type="hidden" name="id" value={n.id}/><button className="btn-secondary">Прочитано</button></form>}
              {n.is_read && <form action={deleteNotificationAction}><input type="hidden" name="id" value={n.id}/><button className="rounded-xl border border-red-400/30 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10">Удалить</button></form>}
            </div>
          </div>
        </div>;
      })}
      {!data?.length && !error && <div className="card text-slate-400">Уведомлений пока нет.</div>}
    </div>
  </div>;
}
