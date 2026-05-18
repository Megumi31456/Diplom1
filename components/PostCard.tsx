import Link from "next/link";
import { Bookmark, Heart, MessageCircle, UserPlus } from "lucide-react";
import { toggleLikeAction } from "@/app/actions/posts";
import { getCommentsCount, getLikesCount } from "@/lib/post-counts";

export function PostCard({ post, next = "/app" }: { post: any; next?: string }) {
  const author = post.author || post.profiles;
  const authorName = author?.full_name || "Автор";
  const authorId = author?.id || post.author_id;
  const categoryName = post.category?.name || post.categories?.name || "Без категории";
  const likesCount = getLikesCount(post);
  const commentsCount = getCommentsCount(post);

  return (
    <article className="card overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/app/post/${post.id}`} className="text-xl font-black hover:text-cyan-200">
            {post.title}
          </Link>
          <p className="mt-1 text-sm text-slate-400">
            <Link href={`/app/profile/${authorId}`} className="hover:text-cyan-200">{authorName}</Link> · {categoryName}
          </p>
        </div>
        <span className="badge">{post.type}</span>
      </div>

      {post.media_url && post.type === "image" && (
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
          <img src={post.media_url} alt="" className="h-64 w-full object-cover" />
        </div>
      )}

      {post.media_url && post.type !== "image" && (
        <a href={post.media_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-100">
          Открыть прикреплённый материал →
        </a>
      )}

      <p className="mt-4 line-clamp-3 whitespace-pre-line text-slate-300">{post.description}</p>

      {post.tags?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((t: string) => <span className="badge" key={t}>#{t}</span>)}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <form action={toggleLikeAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <input type="hidden" name="next" value={next} />
          <button className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 hover:bg-white/10" type="submit">
            <Heart size={16} /> {likesCount}
          </button>
        </form>
        <Link href={`/app/post/${post.id}`} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 hover:bg-white/10">
          <MessageCircle size={16} /> {commentsCount}
        </Link>
        <Link href={`/app/post/${post.id}#save`} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 hover:bg-white/10">
          <Bookmark size={16} /> сохранить
        </Link>
        <Link href={`/app/profile/${authorId}`} className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-200">
          <UserPlus size={14} /> профиль автора
        </Link>
      </div>
    </article>
  );
}
