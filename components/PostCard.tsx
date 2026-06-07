import Link from "next/link";
import { Bookmark, Heart, MessageCircle, UserPlus } from "lucide-react";
import { toggleLikeAction } from "@/app/actions/posts";
import { getCommentsCount, getLikesCount } from "@/lib/post-counts";
import styles from "@/styles/post-card.module.css";

export function PostCard({ post, next = "/app", userId, isSaved = false }: { post: any; next?: string; userId?: string; isSaved?: boolean }) {
  const author = post.author || post.profiles;
  const authorName = author?.full_name || "Автор";
  const authorId = author?.id || post.author_id;
  const categoryName = post.category?.name || post.categories?.name || "Без категории";
  const likesCount = getLikesCount(post);
  const commentsCount = getCommentsCount(post);
  const isLiked = Boolean(userId && post.likes?.some((like: any) => like.user_id === userId));

  return (
    <article className={`card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <Link href={`/app/post/${post.id}`} className={styles.title}>{post.title}</Link>
          <p className={styles.meta}>
            <Link href={`/app/profile/${authorId}`} className={styles.author}>{authorName}</Link> · {categoryName}
          </p>
        </div>
        <span className="badge">{post.type}</span>
      </div>

      {post.media_url && post.type === "image" && <div className={styles.media}><img src={post.media_url} alt="" className={styles.image} /></div>}
      {post.media_url && post.type !== "image" && <a href={post.media_url} target="_blank" rel="noreferrer" className={styles.attachment}>Открыть прикреплённый материал →</a>}

      <p className={styles.description}>{post.description}</p>
      {post.tags?.length ? <div className={styles.tags}>{post.tags.map((tag: string) => <span className="badge" key={tag}>#{tag}</span>)}</div> : null}

      <div className={styles.actions}>
        <form action={toggleLikeAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="next" value={next} />
          <button className={`${styles.action} ${isLiked ? styles.activeAction : ""}`} type="submit" aria-label={isLiked ? "Убрать лайк" : "Поставить лайк"}>
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} /> {likesCount}
          </button>
        </form>
        <Link href={`/app/post/${post.id}`} className={styles.action}><MessageCircle size={16} /> {commentsCount}</Link>
        <Link href={`/app/post/${post.id}#save`} className={`${styles.action} ${isSaved ? styles.activeAction : ""}`}>
          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /> сохранить
        </Link>
        <Link href={`/app/profile/${authorId}`} className={styles.profile}><UserPlus size={14} /> профиль автора</Link>
      </div>
    </article>
  );
}
