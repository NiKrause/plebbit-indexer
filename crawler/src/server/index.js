// server.js (as ES Module)
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { getDb, updateSubplebbitStatus, queueSubplebbit } from '../db.js';
import { refreshSubplebbitQueue, processSubplebbitQueue } from '../subplebbit.js';
import { getPlebbitClient } from '../plebbitClient.js';

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

  
  app.get('/api/queue', async (req, res) => {
    try {
      const db = getDb();
      const { status } = req.query;
      
      let query = 'SELECT * FROM subplebbit_queue';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY updated_at DESC';
      
      const stmt = db.prepare(query);
      const rows = params.length > 0 ? stmt.all(params) : stmt.all();
      
      res.json(rows);
    } catch (err) {
      console.error('Error fetching queue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.get('/api/queue/stats', async (req, res) => {
    try {
      const db = getDb();
      
      const statsQuery = `
        SELECT
          status,
          COUNT(*) as count,
          SUM(success_count) as total_successes,
          SUM(failure_count) as total_failures,
          SUM(total_runs) as total_runs
        FROM subplebbit_queue
        GROUP BY status
      `;
      
      const stmt = db.prepare(statsQuery);
      const stats = stmt.all();
      
      const totalQuery = 'SELECT COUNT(*) as total FROM subplebbit_queue';
      const totalStmt = db.prepare(totalQuery);
      const { total } = totalStmt.get();
      
      res.json({
        total,
        stats
      });
    } catch (err) {
      console.error('Error fetching queue stats:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/queue/add', express.json(), async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }
      
      const db = getDb();
      queueSubplebbit(db, address);
      
      res.json({ success: true, message: `Address ${address} added to queue` });
    } catch (err) {
      console.error('Error adding to queue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/queue/retry', express.json(), async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: 'Address is required' });
      }
      
      const db = getDb();
      updateSubplebbitStatus(db, address, 'queued');
      
      res.json({ success: true, message: `Address ${address} queued for retry` });
    } catch (err) {
      console.error('Error retrying address:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/queue/refresh', async (req, res) => {
    try {
      const db = getDb();
      const count = await refreshSubplebbitQueue(db);
      
      res.json({ success: true, message: `Queue refreshed with ${count} addresses` });
    } catch (err) {
      console.error('Error refreshing queue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/queue/process', async (req, res) => {
    try {
      const { limit } = req.body || {};
      const batchSize = limit ? parseInt(limit) : 5;
      
      const db = getDb();
      const plebbit = await getPlebbitClient();
      
      // Asynchron verarbeiten, damit die API-Antwort nicht blockiert wird
      processSubplebbitQueue(plebbit, db, batchSize)
        .then(subs => console.log(`Processed ${subs.length} subplebbits from queue`))
        .catch(err => console.error('Error processing queue:', err));
      
      res.json({ success: true, message: `Processing ${batchSize} items from queue` });
    } catch (err) {
      console.error('Error processing queue:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}