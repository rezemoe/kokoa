import { db } from '../../utils/db';
import { posts, users, postTags, postEmoticonRules } from '../../database/schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: process.env.SESSION_PASSWORD || 'your-super-secret-password-that-is-at-least-32-characters-long'
  });
  if (!session.data.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const body = await readBody(event);
  const { title, slug, content, tags, reactionMode, emoticonRules } = body;
  
  if (!title || !slug || !content) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' });
  }

  const user = await db.select().from(users).where(eq(users.id, session.data.id as string)).limit(1);
  if (!user.length) {
    await session.clear();
    throw createError({ statusCode: 401, statusMessage: 'User no longer exists. Please log in again.' });
  }

  const newPost = await db.insert(posts).values({
    id: crypto.randomUUID(),
    title,
    slug,
    content,
    viewsCount: 0,
    authorId: session.data.id as string,
    reactionMode: reactionMode || 'all',
  }).returning();

  if (tags && Array.isArray(tags) && tags.length > 0) {
    const postTagValues = tags.map((tagId: string) => ({
      postId: newPost[0].id,
      tagId
    }));
    await db.insert(postTags).values(postTagValues);
  }

  if (emoticonRules && Array.isArray(emoticonRules) && emoticonRules.length > 0) {
    const ruleValues = emoticonRules.map((emoticonId: string) => ({
      postId: newPost[0].id,
      emoticonId
    }));
    await db.insert(postEmoticonRules).values(ruleValues);
  }

  return newPost[0];
});
