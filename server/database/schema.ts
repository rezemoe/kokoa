import { pgTable, text, integer, timestamp, unique } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  reactionMode: text('reaction_mode').default('all').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emoticons = pgTable('emoticons', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
});

export const reactions = pgTable('reactions', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  emoticonId: text('emoticon_id').notNull().references(() => emoticons.id, { onDelete: 'cascade' }),
  ip: text('ip').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    unq: unique().on(table.postId, table.emoticonId, table.ip),
  }
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const postTags = pgTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: unique().on(table.postId, table.tagId),
  }
});

export const postEmoticonRules = pgTable('post_emoticon_rules', {
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  emoticonId: text('emoticon_id').notNull().references(() => emoticons.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: unique().on(table.postId, table.emoticonId),
  }
});
