import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sendMessageAction } from "@/app/actions/messages";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ to?: string; message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const [{ data: conversations, error }, { data: profiles }, { data: unreadRows }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id,user_a,user_b,updated_at,userA:profiles!conversations_user_a_fkey(id,full_name),userB:profiles!conversations_user_b_fkey(id,full_name)")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id,full_name,email").neq("id", user.id).order("full_name").limit(100),
    supabase.from("messages").select("conversation_id").neq("sender_id", user.id).eq("is_read", false),
  ]);
  const unreadByConversation = new Map<string, number>();
  for (const row of unreadRows ?? []) unreadByConversation.set(row.conversation_id, (unreadByConversation.get(row.conversation_id) ?? 0) + 1);

  return (
    <div>
      <h1 className="text-4xl font-black">Личные сообщения</h1>
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
          const unread = unreadByConversation.get(c.id) ?? 0;
          return <Link key={c.id} href={`/app/messages/${c.id}`} className={`card block hover:bg-white/10 ${unread ? "border-blue-400/60 bg-blue-500/[0.08]" : ""}`}><div className="flex items-center justify-between gap-3"><h2 className="font-black">{other?.full_name || "Собеседник"}</h2>{unread > 0 && <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-black text-white">{unread}</span>}</div><p className="mt-1 text-sm text-slate-400">Обновлено: {new Date(c.updated_at).toLocaleString("ru-RU")}</p></Link>;
        })}
        {!conversations?.length && !error && <div className="card text-slate-400">Диалогов пока нет.</div>}
      </div>
    </div>
  );
}
