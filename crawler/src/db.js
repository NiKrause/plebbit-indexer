import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let dbInstance = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  
  const dbPath = process.env.DB_PATH ||
    (process.cwd().endsWith('crawler')
      ? 'db/plebbit_posts.db'
      : path.join(path.dirname(new URL(import.meta.url).pathname), '../db/plebbit_posts.db'));
  
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  dbInstance = new Database(dbPath, {
    prepareRetain: true,
    verbose: console.log
  });
  
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      subplebbitAddress TEXT NOT NULL,
      authorAddress TEXT,
      authorDisplayName TEXT
    );
    
    -- Indizes für häufige Abfragen
    CREATE INDEX IF NOT EXISTS idx_posts_subplebbit ON posts(subplebbitAddress);
    CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp);
  `);
  
  const tableCheck = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'").get();
  if (!tableCheck) {
    throw new Error('Failed to create posts table');
  } else {
    console.log("posts table is available");
  }
  
  return dbInstance;
}
