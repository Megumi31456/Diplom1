import { requireAdmin } from "@/lib/auth";
import { createCategoryAction, updateCategoryAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  return (
    <div>
      <h1 className="text-4xl font-black">Категории и теги</h1>
      <p className="mt-2 text-slate-400">Справочник категорий используется при создании, поиске и систематизации публикаций.</p>
      {params.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>}
      {params.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка: {error.message}</p>}
      <form action={createCategoryAction} className="card mt-8 flex gap-3"><input className="input" name="name" placeholder="Название категории" required/><button className="btn-primary">Добавить</button></form>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((c: any) => <form action={updateCategoryAction} className="card space-y-3" key={c.id}>
          <input type="hidden" name="category_id" value={c.id} />
          <input className="input" name="name" defaultValue={c.name} required />
          <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="is_active" defaultChecked={c.is_active} /> Активна</label>
          <button className="btn-secondary">Сохранить</button>
        </form>)}
      </div>
    </div>
  );
}
