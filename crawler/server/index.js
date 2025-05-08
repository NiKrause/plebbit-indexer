// server.js (as ES Module)
import 'dotenv/config'; // This loads .env automatically
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
const sqlite = sqlite3.verbose();
import path from 'path';
import fs from 'fs';

export function startServer() {
  const app = express();
  const PORT = 3001;
  app.use(cors());

  const dbPath = process.env.DB_PATH ||
    path.join(path.dirname(new URL(import.meta.url).pathname), '../db/plebbit_posts.db');
  
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const db = new sqlite.Database(dbPath);

  app.get('/api/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY rowid DESC', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      console.log("rows delivered", rows.length);
      res.json(rows);
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}