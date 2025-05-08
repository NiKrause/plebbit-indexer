import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

export async function getDb() {
  // Ensure the directory exists
  const dir = path.resolve('./db');
  if (!fs.existsSync(dir)) {
    console.log('Creating db directory');
    fs.mkdirSync(dir, { recursive: true });
  }

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
