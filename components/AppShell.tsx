import Link from "next/link";
import { ReactNode } from "react";
import { Bell, Compass, FolderHeart, LayoutDashboard, MessageCircle, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { isAdmin, isModerator } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

export function AppShell({ children, role, name }: { children: ReactNode; role?: string | null; name?: string | null }) {
  const nav = [
    ["/app", "Лента", Compass],
    ["/app/search", "Поиск", Search],
    ["/app/collections", "Коллекции", FolderHeart],
    ["/app/notifications", "Уведомления", Bell],
    ["/app/messages", "Сообщения", MessageCircle],
    ["/app/profile", "Профиль", Users],
  ] as const;

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#145369,transparent_30%),radial-gradient(circle_at_top_right,#4f1d95,transparent_28%),#07111f]">
    <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-white/10 bg-slate-950/55 p-6 backdrop-blur xl:block">
      <Link href="/app" className="flex items-center gap-3 text-xl font-black"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><Sparkles /></span>Creatoria</Link>
      <div className="mt-8 space-y-2">
        {nav.map(([href, label, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><Icon size={18}/>{label}</Link>)}
        {isModerator(role) && <Link href="/moderator" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-cyan-100 hover:bg-white/10"><ShieldCheck size={18}/>Модерация</Link>}
        {isAdmin(role) && <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-fuchsia-100 hover:bg-white/10"><LayoutDashboard size={18}/>Админ-панель</Link>}
      </div>
      <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/5 p-4">
        <p className="text-sm font-bold">{name || "Пользователь"}</p>
        <p className="text-xs text-slate-400">Роль: {role || "user"}</p>
        <form action={signOutAction} className="mt-3"><button className="text-xs text-slate-300 underline">Выйти</button></form>
      </div>
    </aside>
    <main className="xl:pl-72"><div className="mx-auto max-w-7xl p-5 md:p-8">{children}</div></main>
  </div>;
}
