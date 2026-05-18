export const POST_CARD_SELECT = `
  id,
  author_id,
  category_id,
  title,
  description,
  media_url,
  type,
  visibility,
  tags,
  status,
  likes_count,
  comments_count,
  created_at,
  likes(user_id),
  comments(id, is_hidden),
  author:profiles!posts_author_id_fkey(id, full_name, avatar_url),
  category:categories!posts_category_id_fkey(id, name)
`;
