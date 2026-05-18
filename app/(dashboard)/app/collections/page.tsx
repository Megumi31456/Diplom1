import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createCollectionAction } from "@/app/actions/collections";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("collections")
    .select("id,title,description,is_private,created_at,collection_items(post_id)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-4xl font-black">Коллекции</h1>
      <p className="mt-2 text-slate-400">Создавайте личные подборки и сохраняйте материалы в библиотеку идей.</p>
      {sp.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки коллекций: {error.message}</p>}

      <form action={createCollectionAction} className="card mt-8 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <input className="input" name="title" placeholder="Название коллекции" required />
        <input className="input" name="description" placeholder="Описание" />
        <label className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 text-sm"><input type="checkbox" name="is_private" /> Приватная</label>
        <button className="btn-primary">Создать</button>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((c: any) => (
          <Link href={`/app/collections/${c.id}`} className="card block hover:bg-white/10" key={c.id}>
            <h2 className="text-xl font-black">{c.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{c.description || "Без описания"}</p>
            <div className="mt-4 flex gap-2"><span className="badge">{c.is_private ? "Приватная" : "Публичная"}</span><span className="badge">{c.collection_items?.length || 0} материалов</span></div>
          </Link>
        ))}
        {!data?.length && !error && <div className="card text-slate-400">Коллекций пока нет. Создайте первую подборку.</div>}
      </div>
    </div>
  );
}
