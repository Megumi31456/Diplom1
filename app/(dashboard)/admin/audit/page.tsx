import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("id,action,details,created_at,admin:profiles!admin_audit_logs_admin_id_fkey(full_name,email),target:profiles!admin_audit_logs_target_user_id_fkey(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-4xl font-black">Журнал действий администратора</h1>
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка журнала: {error.message}</p>}
      <div className="card mt-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-3">Дата</th><th className="p-3">Админ</th><th className="p-3">Цель</th><th className="p-3">Действие</th><th className="p-3">Детали</th></tr></thead><tbody>{data?.map((l: any) => <tr className="border-t border-white/10" key={l.id}><td className="p-3">{new Date(l.created_at).toLocaleString('ru-RU')}</td><td className="p-3">{l.admin?.full_name || l.admin?.email}</td><td className="p-3">{l.target?.full_name || l.target?.email || "—"}</td><td className="p-3">{l.action}</td><td className="p-3"><pre className="whitespace-pre-wrap">{JSON.stringify(l.details, null, 2)}</pre></td></tr>)}</tbody></table></div>
    </div>
  );
}
