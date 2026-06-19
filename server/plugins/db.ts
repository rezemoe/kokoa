export default defineNitroPlugin(async (nitroApp) => {
  const { client } = await import('../utils/db');
  
  await client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      views_count INTEGER DEFAULT 0 NOT NULL,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS emoticons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      emoticon_id TEXT NOT NULL REFERENCES emoticons(id) ON DELETE CASCADE,
      ip TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE(post_id, emoticon_id, ip)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS post_tags (
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(post_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS post_emoticon_rules (
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      emoticon_id TEXT NOT NULL REFERENCES emoticons(id) ON DELETE CASCADE,
      UNIQUE(post_id, emoticon_id)
    );
  `);
  
  try {
    await client.exec(`ALTER TABLE posts ADD COLUMN author_id TEXT REFERENCES users(id) ON DELETE SET NULL;`);
  } catch(e) {}
  try {
    await client.exec(`ALTER TABLE posts ADD COLUMN reaction_mode TEXT DEFAULT 'all' NOT NULL;`);
  } catch(e) {}
  try {
    await client.exec(`ALTER TABLE reactions ADD COLUMN ip TEXT;`); // Will fail if reactions is dropped and recreated, but that's ok. 
    // Wait, let's just drop and recreate reactions because the PK changed.
    await client.exec(`
      DROP TABLE IF EXISTS reactions;
      CREATE TABLE reactions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        emoticon_id TEXT NOT NULL REFERENCES emoticons(id) ON DELETE CASCADE,
        ip TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(post_id, emoticon_id, ip)
      );
    `);
  } catch(e) {}
  
  // Create default admin user if no users exist
  const res = await client.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(res.rows[0].count as string) === 0) {
    const { randomUUID } = await import('node:crypto');
    const { hashPassword } = await import('../utils/auth');
    const hash = await hashPassword('admin');
    await client.query(
      'INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)',
      [randomUUID(), 'admin', hash]
    );
    console.log('Created default admin user with password "admin"');
  }
});
