import { db } from '../../utils/db';
import { emoticons } from '../../database/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  if (query.limit === '-1') {
    return await db.select().from(emoticons);
  }

  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 100;
  const offset = (page - 1) * limit;

  return await db.select().from(emoticons).limit(limit).offset(offset);
});
