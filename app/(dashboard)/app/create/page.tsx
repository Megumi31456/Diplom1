import { createPostAction } from "@/app/actions/posts";
import { requireUser } from "@/lib/auth";

export default async function CreatePostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireUser();
  const { data: categories } = await supabase.from("categories").select("id,name").eq("is_active", true).order("name");

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">Создание публикации</h1>
      <p className="mt-2 text-slate-400">Добавьте материал, описание, категорию, теги и выберите режим публикации.</p>
      {params.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}

      <form action={createPostAction} className="card mt-8 space-y-4" encType="multipart/form-data">
        <input className="input" name="title" placeholder="Название" required />
        <textarea className="input min-h-36" name="description" placeholder="Описание" required />
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-300">Изображение публикации</span>
          <input className="input" name="media_file" type="file" accept="image/*" />
          <span className="block text-xs text-slate-500">Файл будет загружен в Supabase Storage bucket <b>images</b>, а в публикацию сохранится ссылка из хранилища.</span>
        </label>
        <input className="input" name="media_url" placeholder="Ссылка только для типа Видео/Ссылка/Материал" />
        <div className="grid gap-4 md:grid-cols-3">
          <select className="input" name="type"><option value="text">Текст</option><option value="image">Изображение</option><option value="video">Видео</option><option value="link">Ссылка</option></select>
          <select className="input" name="visibility"><option value="public">Публично</option><option value="private">Приватно</option></select>
          <select className="input" name="category_id"><option value="">Категория</option>{categories?.map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
        </div>
        <input className="input" name="tags" placeholder="Теги через запятую: дизайн, арт, ui" />
        <div className="flex flex-wrap gap-3">
          <button name="status" value="published" className="btn-primary">Опубликовать</button>
          <button name="status" value="draft" className="btn-secondary">Сохранить как черновик</button>
        </div>
      </form>
    </div>
  );
}
