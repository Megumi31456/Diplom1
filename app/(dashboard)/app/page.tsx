import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { POST_CARD_SELECT } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ message?: string; error?: string; tab?: string }>;

export default async function FeedPage({ searchParams }: { searchParams?: Params }) {
  const params = searchParams ? await searchParams : {};
  const { user, profile, supabase } = await requireUser();
  const tab = params.tab === "following" ? "following" : params.tab === "recommended" ? "recommended" : "all";

  let query = supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "published")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(40);

  if (tab === "following") {
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
    const ids = (follows ?? []).map((f: any) => f.following_id);
    query = ids.length ? query.in("author_id", ids) : query.eq("author_id", "00000000-0000-0000-0000-000000000000");
  }

  if (tab === "recommended" && profile?.interests?.length) {
    query = query.overlaps("tags", profile.interests);
  }

  const { data: posts, error } = await query;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"><Sparkles size={16}/> Персональная творческая лента</p>
          <h1 className="mt-4 text-4xl font-black">Лента публикаций</h1>
          <p className="mt-2 text-slate-400">Новые, рекомендованные и опубликованные авторами из ваших подписок материалы.</p>
        </div>
        <Link href="/app/create" className="btn-primary"><Plus size={18}/> Создать публикацию</Link>
      </div>

      {params.message && <p className="mt-6 rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{params.message}</p>}
      {params.error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{params.error}</p>}
      {error && <p className="mt-6 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">Ошибка загрузки ленты: {error.message}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link className={`btn-secondary ${tab === "all" ? "border-cyan-300" : ""}`} href="/app">Все публикации</Link>
        <Link className={`btn-secondary ${tab === "recommended" ? "border-cyan-300" : ""}`} href="/app?tab=recommended">Рекомендации</Link>
        <Link className={`btn-secondary ${tab === "following" ? "border-cyan-300" : ""}`} href="/app?tab=following">Подписки</Link>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {posts?.map((post: any) => <PostCard key={post.id} post={post} next={`/app${tab === "all" ? "" : `?tab=${tab}`}`} />)}
      </div>

      {!posts?.length && !error && (
        <div className="card mt-8 text-slate-400">
          {tab === "recommended"
            ? "Рекомендаций пока нет. Добавьте интересы в профиле или поставьте лайки нескольким публикациям."
            : tab === "following"
              ? "В подписках пока нет опубликованных материалов. Найдите авторов через поиск и подпишитесь."
              : "Пока нет опубликованных материалов. Создайте публикацию и одобрите её через модерацию."}
        </div>
      )}
    </div>
  );
}
