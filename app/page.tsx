import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

export default function Home() {
  return <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#1f7a8c55,transparent_35%),#07111f] text-white">
    <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"><Sparkles size={16}/> Startup-style creative social platform</div>
        <h1 className="text-5xl font-black tracking-tight md:text-7xl">Creatoria — платформа для творческих материалов, коллекций и рекомендаций.</h1>
        <div className="mt-8 flex flex-wrap gap-4"><Link href="/login" className="btn-primary">Войти <ArrowRight className="ml-2" size={18}/></Link><Link href="/register" className="btn-secondary">Создать аккаунт</Link></div>
      </div>
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {[['Пользователь', 'Лента, публикации, коллекции, лайки, комментарии, жалобы', Wand2], ['Модератор', 'Очередь проверки, жалобы, решения и журнал действий', ShieldCheck], ['Администратор', 'Пользователи, роли, категории, настройки и аналитика', Sparkles]].map(([t,d,Icon]: any) => <div className="card" key={t}><Icon className="text-cyan-200"/><h3 className="mt-4 text-xl font-black">{t}</h3><p className="mt-2 text-sm text-slate-400">{d}</p></div>)}
      </div>
    </section>
  </main>;
}
