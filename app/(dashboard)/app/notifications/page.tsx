import { requireUser } from "@/lib/auth";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-4xl font-black">Уведомления</h1><p className="mt-2 text-slate-400">Лайки, комментарии, подписки, жалобы и решения модерации.</p></div>
        <form action={markAllNotificationsReadAction}><button className="btn-secondary">Прочитать все</button></form>
      </div>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка уведомлений: {error.message}</p>}

      <div className="mt-8 space-y-3">
        {data?.map((n: any) => (
          <div className={`card ${n.is_read ? "opacity-70" : "border-cyan-300/40"}`} key={n.id}>
            <div className="flex flex-wrap justify-between gap-3">
              <div><h2 className="font-bold">{n.title}</h2><p className="mt-1 text-sm text-slate-400">{n.body}</p><p className="mt-2 text-xs text-slate-500">{new Date(n.created_at).toLocaleString("ru-RU")}</p></div>
              {!n.is_read && <form action={markNotificationReadAction}><input type="hidden" name="id" value={n.id} /><button className="btn-secondary">Прочитано</button></form>}
            </div>
          </div>
        ))}
        {!data?.length && !error && <div className="card text-slate-400">Уведомлений пока нет.</div>}
      </div>
    </div>
  );
}
