import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { POST_CARD_SELECT } from "@/lib/queries";
import styles from "@/styles/feed.module.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ message?: string; error?: string; tab?: string }>;

export default async function FeedPage({ searchParams }: { searchParams?: Params }) {
  const params = searchParams ? await searchParams : {};
  const { user, supabase } = await requireUser();
  const tab = params.tab === "following" ? "following" : params.tab === "recommended" ? "recommended" : "all";

  let posts: any[] = [];
  let loadError: string | null = null;

  if (tab === "recommended") {
    const { data: ranked, error: recommendationError } = await supabase.rpc("get_recommended_post_ids", { result_limit: 40 });
    if (recommendationError) {
      loadError = `Ошибка расчёта рекомендаций: ${recommendationError.message}`;
    } else {
      const ids = (ranked ?? []).map((item: any) => item.post_id);
      if (ids.length) {
        const { data, error } = await supabase.from("posts").select(POST_CARD_SELECT).in("id", ids);
        if (error) loadError = `Ошибка загрузки рекомендаций: ${error.message}`;
        const order = new Map<string, number>(ids.map((id: string, index: number) => [id, index] as [string, number]));
        posts = (data ?? []).sort((a: any, b: any) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
      }
    }
  } else {
    let query = supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(40);

    if (tab === "following") {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (follows ?? []).map((follow: any) => follow.following_id);
      query = ids.length ? query.in("author_id", ids) : query.eq("author_id", "00000000-0000-0000-0000-000000000000");
    }

    const { data, error } = await query;
    posts = data ?? [];
    if (error) loadError = `Ошибка загрузки ленты: ${error.message}`;
  }

  const postIds = posts.map((post: any) => post.id);
  const { data: savedRows } = postIds.length
    ? await supabase.from("collection_items").select("post_id,collections!inner(owner_id)").in("post_id", postIds).eq("collections.owner_id", user.id)
    : { data: [] as any[] };
  const savedIds = new Set((savedRows ?? []).map((row: any) => row.post_id));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}><Sparkles size={16}/> Персональная творческая лента</p>
          <h1 className={styles.title}>Лента публикаций</h1>
          <p className={styles.subtitle}>Новые, рекомендованные и опубликованные авторами из ваших подписок материалы.</p>
        </div>
        <Link href="/app/create" className="btn-primary"><Plus size={18}/> Создать публикацию</Link>
      </div>

      {params.message && <p className={`${styles.notice} ${styles.success}`}>{params.message}</p>}
      {params.error && <p className={`${styles.notice} ${styles.error}`}>{params.error}</p>}
      {loadError && <p className={`${styles.notice} ${styles.error}`}>{loadError}</p>}

      <div className={styles.tabs}>
        <Link className={`btn-secondary ${tab === "all" ? styles.activeTab : ""}`} href="/app">Все публикации</Link>
        <Link className={`btn-secondary ${tab === "recommended" ? styles.activeTab : ""}`} href="/app?tab=recommended">Рекомендации</Link>
        <Link className={`btn-secondary ${tab === "following" ? styles.activeTab : ""}`} href="/app?tab=following">Подписки</Link>
      </div>

      <div className={styles.grid}>
        {posts.map((post: any) => <PostCard key={post.id} post={post} userId={user.id} isSaved={savedIds.has(post.id)} next={`/app${tab === "all" ? "" : `?tab=${tab}`}`} />)}
      </div>

      {!posts.length && !loadError && (
        <div className={`card ${styles.empty}`}>
          {tab === "recommended"
            ? "Рекомендации появятся после взаимодействия с публикациями. Поставьте лайки, оставьте комментарии или добавьте работы в коллекции."
            : tab === "following"
              ? "В подписках пока нет опубликованных материалов. Найдите авторов через поиск и подпишитесь."
              : "Пока нет опубликованных материалов."}
        </div>
      )}
    </div>
  );
}
