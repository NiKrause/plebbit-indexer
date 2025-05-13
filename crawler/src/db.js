import sqlite3 from 'sqlite3';
const sqlite = sqlite3.verbose();
import fs from 'fs';
import path from 'path';

export function getDb(callback) {
  const projectRoot = path.resolve(process.cwd(), 'crawler');
  const dbPath = process.env.DB_PATH || path.join(projectRoot, 'db', 'plebbit_posts.db');
  console.log("dbPath", dbPath);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const db = new sqlite.Database(dbPath);
  console.log("db opened at", dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      timestamp INTEGER,
      title TEXT,
      content TEXT,
      subplebbitAddress TEXT,
      authorAddress TEXT,
      authorDisplayName TEXT
    )
  `, (err) => {
    if (err) {
      callback(err);
      return;
    }
    
    // Verify the table was created
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'", (err, tableCheck) => {
      if (err) {
        callback(err);
        return;
      }
      
      if (!tableCheck) {
        callback(new Error('Failed to create posts table'));
      } else {
        console.log("posts table is available");
        callback(null, db);
      }
    });
  });
}
