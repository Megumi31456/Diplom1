export function getLikesCount(post: any): number {
  if (Array.isArray(post?.likes)) return post.likes.length;
  return Number(post?.likes_count ?? 0);
}

export function getCommentsCount(post: any): number {
  if (Array.isArray(post?.comments)) {
    return post.comments.filter((comment: any) => comment?.is_hidden !== true).length;
  }
  return Number(post?.comments_count ?? 0);
}
