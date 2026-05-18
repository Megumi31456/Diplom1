import { requireModerator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ModLogsPage() {
  const { supabase } = await requireModerator();
  const { data, error } = await supabase
    .from("moderation_logs")
    .select("id,target_type,action,reason,created_at,moderator:profiles!moderation_logs_moderator_id_fkey(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-4xl font-black">Журнал модерации</h1>
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка журнала: {error.message}</p>}
      <div className="card mt-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-3">Дата</th><th className="p-3">Модератор</th><th className="p-3">Объект</th><th className="p-3">Действие</th><th className="p-3">Причина</th></tr></thead><tbody>{data?.map((l: any) => <tr className="border-t border-white/10" key={l.id}><td className="p-3">{new Date(l.created_at).toLocaleString('ru-RU')}</td><td className="p-3">{l.moderator?.full_name || l.moderator?.email}</td><td className="p-3">{l.target_type}</td><td className="p-3">{l.action}</td><td className="p-3">{l.reason}</td></tr>)}</tbody></table></div>
    </div>
  );
}
