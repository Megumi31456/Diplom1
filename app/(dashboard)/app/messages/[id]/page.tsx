import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { sendMessageAction } from "@/app/actions/messages";

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const [{ data: conversation }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("id,user_a,user_b,userA:profiles!conversations_user_a_fkey(id,full_name),userB:profiles!conversations_user_b_fkey(id,full_name)").eq("id", id).single(),
    supabase.from("messages").select("id,body,created_at,sender_id,sender:profiles!messages_sender_id_fkey(id,full_name)").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);

  if (!conversation || (conversation.user_a !== user.id && conversation.user_b !== user.id)) notFound();
  const other = conversation.user_a === user.id ? conversation.userB : conversation.userA;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-black">Диалог с {other?.full_name || "пользователем"}</h1>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}

      <div className="card mt-8 max-h-[560px] space-y-3 overflow-y-auto">
        {messages?.map((m: any) => <div key={m.id} className={`rounded-2xl p-4 ${m.sender_id === user.id ? "ml-auto bg-cyan-300 text-slate-950" : "bg-white/10 text-white"} max-w-[80%]`}><p className="text-sm font-bold">{m.sender?.full_name}</p><p className="mt-1 whitespace-pre-line">{m.body}</p><p className="mt-2 text-xs opacity-70">{new Date(m.created_at).toLocaleString("ru-RU")}</p></div>)}
        {!messages?.length && <p className="text-slate-400">Сообщений пока нет.</p>}
      </div>

      <form action={sendMessageAction} className="mt-4 flex gap-3">
        <input type="hidden" name="recipient_id" value={other?.id} />
        <input className="input" name="body" placeholder="Написать сообщение" required />
        <button className="btn-primary">Отправить</button>
      </form>
    </div>
  );
}
