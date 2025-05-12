import sqlite3 from 'sqlite3';
const sqlite = sqlite3.verbose();
import fs from 'fs';
import path from 'path';

export async function getDb() {
  
  const dbPath = process.env.DB_PATH ||
    (process.cwd().endsWith('crawler') 
      ? 'db/plebbit_posts.db'
      : path.join(path.dirname(new URL(import.meta.url).pathname), '../db/plebbit_posts.db'));
  
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const db = new sqlite.Database(dbPath);
  console.log("db opened", db);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      timestamp INTEGER,
      title TEXT,
      content TEXT,
      subplebbitAddress TEXT,
      authorAddress TEXT,
      authorDisplayName TEXT
    )
  `);
  // Verify the table was created
  const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'");
  if (!tableCheck) {
    throw new Error('Failed to create posts table');
  } else {
    console.log("posts table is available");
  }
  return db;
}
