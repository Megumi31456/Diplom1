import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { POST_CARD_SELECT } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?:  string; tag?: string; sort?: string }> }) { 
  const params = await searchParams;
  const { user, supabase } = await requireUser();
  const q = (params.q ?? "").trim();
  const type = (params.type ?? "").trim();
  const category = (params.category ?? "").trim();
  const tag = (params.tag ?? "").trim(); 
  const sort = params.sort === "popular" ? "popular" : "new";

  const [categoriesResult, tagsResult] = await Promise.all([
    supabase.from("categories").select("id,name").eq("is_active", true).order("name"),
    supabase.from("tags").select("id,name").order("name"),
  ]);

  const categories = categoriesResult.data ?? [];
  const tags = tagsResult.data ?? [];

  let postsQuery = supabase.from("posts").select(POST_CARD_SELECT).eq("status", "published").eq("visibility", "public");
  if (q) postsQuery = postsQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (type) postsQuery = postsQuery.eq("type", type);
  if (category) postsQuery = postsQuery.eq("category_id", category);
  if (tag) postsQuery = postsQuery.contains("tags", [tag]);
  postsQuery = postsQuery.order(sort === "popular" ? "likes_count" : "created_at", { ascending: false }).limit(50);

  const [postsResult, authorsResult] = await Promise.all([
    postsQuery,
    q ? supabase.from("profiles").select("id,full_name,bio,avatar_url,role").or(`full_name.ilike.%${q}%,bio.ilike.%${q}%`).limit(20) : { data: [], error: null },
  ]);

  const resultPosts = postsResult.data ?? [];
  const resultIds = resultPosts.map((post: any) => post.id);
  const { data: savedRows } = resultIds.length ? await supabase.from("collection_items").select("post_id,collections!inner(owner_id)").in("post_id", resultIds).eq("collections.owner_id", user.id) : { data: [] as any[] };
  const savedIds = new Set((savedRows ?? []).map((row: any) => row.post_id));

  return (
    <div>
      <h1 className="text-4xl font-black">Поиск и фильтрация</h1>
      <p className="mt-2 text-slate-400">Ищите материалы по названию, описанию, типу, категории, тегам, популярности и авторам.</p>

      <form className="card mt-8 grid gap-3 md:grid-cols-[1fr_150px_160px_140px_130px_auto]">
        <input className="input" name="q" defaultValue={q} placeholder="Название, описание, автор" />
        <select className="input" name="type" defaultValue={type}><option value="">Все типы</option><option value="text">Текст</option><option value="image">Изображение</option><option value="video">Видео</option><option value="link">Ссылка</option></select>
        <select className="input" name="category" defaultValue={category}><option value="">Все категории</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="input" name="tag" defaultValue={tag}><option value="">Все теги</option>{tags.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
        <select className="input" name="sort" defaultValue={sort}><option value="new">Новые</option><option value="popular">Популярные</option></select>
        <button className="btn-primary">Найти</button>
      </form>

      {tagsResult.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки тегов: {tagsResult.error.message}</p>}

      {postsResult.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка поиска: {postsResult.error.message}</p>}

      {q && authorsResult.data?.length ? (
        <section className="mt-8">
          <h2 className="text-2xl font-black">Авторы</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {authorsResult.data.map((author: any) => <Link key={author.id} href={`/app/profile/${author.id}`} className="card block hover:bg-white/10"><h3 className="font-black">{author.full_name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-400">{author.bio || author.role}</p></Link>)}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-2xl font-black">Материалы</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {postsResult.data?.map((post: any) => <PostCard key={post.id} post={post} userId={user.id} isSaved={savedIds.has(post.id)} next={`/app/search?q=${encodeURIComponent(q)}`} />)}
        </div>
        {!postsResult.data?.length && !postsResult.error && <div className="card mt-4 text-slate-400">Ничего не найдено.</div>}
      </section>
    </div>
  );
}
