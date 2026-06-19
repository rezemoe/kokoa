import { db } from '../../utils/db';
import { posts, postTags, postEmoticonRules } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: process.env.SESSION_PASSWORD || 'your-super-secret-password-that-is-at-least-32-characters-long' });
  if (!session.data.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const slug = getRouterParam(event, 'slug');
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' });

  const body = await readBody(event);
  const { title, content, tags, reactionMode, emoticonRules } = body;
  
  if (!title || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' });
  }

  const updatedPost = await db.update(posts)
    .set({ title, content, reactionMode: reactionMode || 'all' })
    .where(eq(posts.slug, slug))
    .returning();

  if (!updatedPost.length) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' });
  }

  // Update tags
  await db.delete(postTags).where(eq(postTags.postId, updatedPost[0].id));
  
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const postTagValues = tags.map((tagId: string) => ({
      postId: updatedPost[0].id,
      tagId
    }));
    await db.insert(postTags).values(postTagValues);
  }

  // Update emoticon rules
  await db.delete(postEmoticonRules).where(eq(postEmoticonRules.postId, updatedPost[0].id));

  if (emoticonRules && Array.isArray(emoticonRules) && emoticonRules.length > 0) {
    const ruleValues = emoticonRules.map((emoticonId: string) => ({
      postId: updatedPost[0].id,
      emoticonId
    }));
    await db.insert(postEmoticonRules).values(ruleValues);
  }

  return updatedPost[0];
});
