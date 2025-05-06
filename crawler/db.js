import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function getDb() {
  const db = await open({
    filename: './db/plebbit_posts.db',
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT,
      subplebbitAddress TEXT,
      authorAddress TEXT,
      authorDisplayName TEXT
    )
  `);
  return db;
}
