import { db } from '../../utils/db';
import { posts, reactions, emoticons, users, tags, postTags, postEmoticonRules } from '../../database/schema';
import { eq, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' });

  const postRes = await db.select({
    id: posts.id,
    title: posts.title,
    slug: posts.slug,
    content: posts.content,
    viewsCount: posts.viewsCount,
    authorId: posts.authorId,
    reactionMode: posts.reactionMode,
    createdAt: posts.createdAt,
    authorName: users.username,
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.slug, slug)).limit(1);

  if (!postRes.length) throw createError({ statusCode: 404, statusMessage: 'Post not found' });
  
  const post = postRes[0];

  // Fetch reactions along with emoticon details dynamically counted from individual IPs
  const postReactions = await db.select({
    id: emoticons.id,
    name: emoticons.name,
    imageUrl: emoticons.imageUrl,
    count: sql`cast(count(${reactions.id}) as int)`
  })
  .from(reactions)
  .innerJoin(emoticons, eq(reactions.emoticonId, emoticons.id))
  .where(eq(reactions.postId, post.id))
  .groupBy(emoticons.id, emoticons.name, emoticons.imageUrl);
  const postTagsData = await db.select({
    id: tags.id,
    name: tags.name
  })
  .from(postTags)
  .innerJoin(tags, eq(postTags.tagId, tags.id))
  .where(eq(postTags.postId, post.id));

  const rulesData = await db.select({
    emoticonId: postEmoticonRules.emoticonId
  })
  .from(postEmoticonRules)
  .where(eq(postEmoticonRules.postId, post.id));

  return {
    ...post,
    reactions: postReactions,
    tags: postTagsData,
    emoticonRules: rulesData.map(r => r.emoticonId)
  };
});
