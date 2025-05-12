// server.js (as ES Module)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from '../db.js';

export async function startServer() {
  const app = express();
  const PORT = 3001;
  app.use(cors());

  const db = await getDb();

  // Check if posts table exists and count records
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'", (err, table) => {
    if (err) {
      console.error('Error checking posts table:', err);
      return;
    }
    console.log('Successfully checked posts table existence');
    
    if (!table) {
      console.log('Posts table does not exist');
      return;
    }
    console.log('Posts table exists');

    db.get('SELECT COUNT(*) as count FROM posts', (err, result) => {
      if (err) {
        console.error('Error counting posts:', err);
        return;
      }
      console.log(`Posts table exists with ${result.count} records`);
    });
  });

  app.get('/api/posts', (req, res) => {
    console.log("getting posts");
    db.all('SELECT * FROM posts ORDER BY rowid DESC', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      console.log("rows delivered", rows.length);
      res.json(rows);
    });
  });

  app.get('/api/posts/search', (req, res) => {
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
    db.all(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
      if (err) {
        console.error('Error searching posts:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Search results for "${q}":`, rows.length);
      res.json(rows);
    });
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}