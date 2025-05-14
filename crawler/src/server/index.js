// server.js (as ES Module)
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { getDb } from '../db.js';

export async function startServer(_db) {
  const db = getDb(); 
  const app = express();
  const PORT = 3001;
  app.use(cors());

  try {
    const tableStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'");
    const table = tableStmt.get();
    
    if (!table) {
      console.log('Posts table does not exist');
      return;
    }

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
    const result = countStmt.get();
    console.log(`Posts table exists with ${result.count} records`);
  } catch (err) {
    console.error('Error checking posts table:', err);
  }

  app.get('/api/posts', async (req, res) => {
    try {
      const db = getDb(); 
      console.log("getting posts");
      
      const postsStmt = db.prepare('SELECT * FROM posts ORDER BY rowid DESC');
      const rows = postsStmt.all();
      
      console.log("rows delivered", rows.length);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/posts/search', async (req, res) => {
    try {
      const db = getDb();
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
      }

      const searchQuery = `
        SELECT * FROM posts
        WHERE LOWER(title) LIKE LOWER(?)
        OR LOWER(content) LIKE LOWER(?)
        OR LOWER(authorDisplayName) LIKE LOWER(?)
        OR LOWER(subplebbitAddress) LIKE LOWER(?)
        ORDER BY rowid DESC
      `;
      
      const searchTerm = `%${q}%`;
    
      const searchStmt = db.prepare(searchQuery);
      const rows = searchStmt.all([searchTerm, searchTerm, searchTerm, searchTerm]);
      
      console.log(`Search results for "${q}":`, rows.length);
      res.json(rows);
    } catch (err) {
      console.error('Error searching posts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}