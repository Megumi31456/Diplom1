import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { deleteCollectionAction, removePostFromCollectionAction, updateCollectionAction } from "@/app/actions/collections";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { user, supabase } = await requireUser();
  const { data: collection } = await supabase.from("collections").select("*").eq("id", id).single();
  if (!collection) notFound();
  const isOwner = collection.owner_id === user.id;

  const { data: items, error } = await supabase
    .from("collection_items")
    .select(`
      post_id,
      post:posts!collection_items_post_id_fkey(
        id,author_id,category_id,title,description,media_url,type,visibility,tags,status,likes_count,comments_count,created_at,
        author:profiles!posts_author_id_fkey(id,full_name,avatar_url),
        category:categories!posts_category_id_fkey(id,name)
      )
    `)
    .eq("collection_id", id)
    .order("added_at", { ascending: false });

  return (
    <div>
      {sp.message && <p className="mb-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{sp.message}</p>}
      {sp.error && <p className="mb-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{sp.error}</p>}
      {error && <p className="mb-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки материалов: {error.message}</p>}

      <section className="card">
        <h1 className="text-4xl font-black">{collection.title}</h1>
        <p className="mt-2 text-slate-400">{collection.description || "Без описания"}</p>
        <span className="badge mt-4 inline-block">{collection.is_private ? "Приватная" : "Публичная"}</span>

        {isOwner && (
          <form action={updateCollectionAction} className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input type="hidden" name="collection_id" value={collection.id} />
            <input className="input" name="title" defaultValue={collection.title} required />
            <input className="input" name="description" defaultValue={collection.description ?? ""} />
            <label className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 text-sm"><input type="checkbox" name="is_private" defaultChecked={collection.is_private} /> Приватная</label>
            <button className="btn-secondary">Сохранить</button>
          </form>
        )}

        {isOwner && (
          <form action={deleteCollectionAction} className="mt-3">
            <input type="hidden" name="collection_id" value={collection.id} />
            <button className="text-sm text-red-300 underline">Удалить коллекцию</button>
          </form>
        )}
      </section>

      <h2 className="mt-8 text-2xl font-black">Материалы коллекции</h2>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {items?.map((item: any) => item.post && (
          <div key={item.post_id} className="space-y-2">
            <PostCard post={item.post} next={`/app/collections/${id}`} />
            {isOwner && (
              <form action={removePostFromCollectionAction}>
                <input type="hidden" name="collection_id" value={id} />
                <input type="hidden" name="post_id" value={item.post_id} />
                <button className="text-sm text-red-300 underline">Убрать из коллекции</button>
              </form>
            )}
          </div>
        ))}
      </div>
      {!items?.length && !error && <div className="card mt-4 text-slate-400">В коллекции пока нет материалов.</div>}
    </div>
  );
}
