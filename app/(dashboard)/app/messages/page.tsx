import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sendMessageAction } from "@/app/actions/messages";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string; message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const [{ data: conversations, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id,user_a,user_b,updated_at,userA:profiles!conversations_user_a_fkey(id,full_name),userB:profiles!conversations_user_b_fkey(id,full_name)")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name,email").neq("id", user.id).order("full_name").limit(100),
  ]);

  return (
    <div>
      <h1 className="text-4xl font-black">Личные сообщения</h1>
      <p className="mt-2 text-slate-400">Простой модуль переписки между пользователями.</p>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки диалогов: {error.message}</p>}

      <form action={sendMessageAction} className="card mt-8 grid gap-3 md:grid-cols-[260px_1fr_auto]">
        <select className="input" name="recipient_id" defaultValue={sp.to ?? ""} required>
          <option value="">Получатель</option>
          {profiles?.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
        </select>
        <input className="input" name="body" placeholder="Текст сообщения" required />
        <button className="btn-primary">Отправить</button>
      </form>

      <div className="mt-8 space-y-3">
        {conversations?.map((c: any) => {
          const other = c.user_a === user.id ? c.userB : c.userA;
          return <Link key={c.id} href={`/app/messages/${c.id}`} className="card block hover:bg-white/10"><h2 className="font-black">{other?.full_name || "Собеседник"}</h2><p className="mt-1 text-sm text-slate-400">Обновлено: {new Date(c.updated_at).toLocaleString("ru-RU")}</p></Link>;
        })}
        {!conversations?.length && !error && <div className="card text-slate-400">Диалогов пока нет.</div>}
      </div>
    </div>
  );
}
