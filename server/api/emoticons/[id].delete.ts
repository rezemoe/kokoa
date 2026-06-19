import { db } from '../../utils/db';
import { emoticons } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: process.env.SESSION_PASSWORD || 'your-super-secret-password-that-is-at-least-32-characters-long' });
  if (!session.data.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' });

  await db.delete(emoticons).where(eq(emoticons.id, id));

  return { success: true };
});
