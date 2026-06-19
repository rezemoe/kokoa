import { db } from '../../utils/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const session = await useSession(event, { password: process.env.SESSION_PASSWORD || 'your-super-secret-password-that-is-at-least-32-characters-long' });
  if (!session.data.id) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' });

  const userRes = await db.select({
    id: users.id,
    username: users.username
  }).from(users).where(eq(users.id, id)).limit(1);

  if (!userRes.length) throw createError({ statusCode: 404, statusMessage: 'Not found' });

  return userRes[0];
});
