import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { updatePostAction } from "@/app/actions/posts";

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).eq("author_id", user.id).single(),
    supabase.from("categories").select("id,name").eq("is_active", true).order("name"),
  ]);

  if (!post) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">Редактирование публикации</h1>
      <p className="mt-2 text-slate-400">Черновики, отклонённые и возвращённые на доработку материалы можно снова отправить на модерацию.</p>
      {sp.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}

      <form action={updatePostAction} className="card mt-8 space-y-4">
        <input type="hidden" name="post_id" value={post.id} />
        <input className="input" name="title" defaultValue={post.title} placeholder="Название" required />
        <textarea className="input min-h-36" name="description" defaultValue={post.description} placeholder="Описание" required />
        <input className="input" name="media_url" defaultValue={post.media_url ?? ""} placeholder="Ссылка на изображение / видео / материал" />
        <div className="grid gap-4 md:grid-cols-3">
          <select className="input" name="type" defaultValue={post.type}><option value="text">Текст</option><option value="image">Изображение</option><option value="video">Видео</option><option value="link">Ссылка</option></select>
          <select className="input" name="visibility" defaultValue={post.visibility}><option value="public">Публично</option><option value="private">Приватно</option></select>
          <select className="input" name="category_id" defaultValue={post.category_id ?? ""}><option value="">Категория</option>{categories?.map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
        </div>
        <input className="input" name="tags" defaultValue={(post.tags ?? []).join(", ")} placeholder="Теги через запятую" />
        <div className="flex flex-wrap gap-3">
          <button name="submit" value="publish" className="btn-primary">Отправить на модерацию</button>
          <button name="submit" value="save" className="btn-secondary">Сохранить черновик</button>
        </div>
      </form>
    </div>
  );
}
