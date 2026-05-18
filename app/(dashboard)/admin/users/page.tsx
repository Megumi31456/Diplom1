import { requireAdmin } from "@/lib/auth";
import { updateUserRoleAction, updateUserStatusAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; q?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const q = (params.q ?? "").trim();
  let query = supabase.from("profiles").select("id,full_name,email,role,status,created_at").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error } = await query;

  return (
    <div>
      <h1 className="text-4xl font-black">Управление пользователями</h1>
      {params.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>}
      {params.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка: {error.message}</p>}
      <form className="card mt-8 flex gap-3"><input className="input" name="q" defaultValue={q} placeholder="Поиск по имени или email" /><button className="btn-primary">Найти</button></form>
      <div className="card mt-8 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr><th className="p-3">Имя</th><th className="p-3">Email</th><th className="p-3">Роль</th><th className="p-3">Статус</th><th className="p-3">Действия</th></tr></thead><tbody>{data?.map((u: any) => <tr className="border-t border-white/10" key={u.id}><td className="p-3">{u.full_name}</td><td className="p-3">{u.email}</td><td className="p-3">{u.role}</td><td className="p-3">{u.status}</td><td className="p-3"><div className="flex flex-wrap gap-2"><form action={updateUserRoleAction} className="flex gap-2"><input type="hidden" name="user_id" value={u.id}/><select className="input w-36" name="role" defaultValue={u.role}><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select><button className="btn-secondary">Роль</button></form><form action={updateUserStatusAction} className="flex gap-2"><input type="hidden" name="user_id" value={u.id}/><select className="input w-32" name="status" defaultValue={u.status}><option value="active">active</option><option value="blocked">blocked</option></select><button className="btn-secondary">Статус</button></form></div></td></tr>)}</tbody></table></div>
    </div>
  );
}
