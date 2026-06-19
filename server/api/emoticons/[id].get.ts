import { db } from '../../utils/db';
import { emoticons } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' });

  const res = await db.select().from(emoticons).where(eq(emoticons.id, id)).limit(1);

  if (!res.length) throw createError({ statusCode: 404, statusMessage: 'Not found' });

  return res[0];
});
