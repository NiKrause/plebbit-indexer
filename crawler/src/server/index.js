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
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const rawLimit = req.query.limit !== undefined ? parseInt(req.query.limit) : 20;
      
      // Special case: limit=0 means "return all posts"
      const limit = rawLimit === 0 ? null : Math.max(1, rawLimit);
      const offset = limit ? (page - 1) * limit : 0;
      
      console.log(`Getting posts ${limit ? `page ${page} with limit ${limit}` : 'with no limit'}`);
      
      // Get total count for pagination metadata
      const countStmt = db.prepare('SELECT COUNT(*) as total FROM posts');
      const { total } = countStmt.get();
      
      // Get posts - either paginated or all
      let postsStmt;
      let rows;
      
      if (limit) {
        postsStmt = db.prepare('SELECT * FROM posts ORDER BY rowid DESC LIMIT ? OFFSET ?');
        rows = postsStmt.all([limit, offset]);
      } else {
        postsStmt = db.prepare('SELECT * FROM posts ORDER BY rowid DESC');
        rows = postsStmt.all();
      }
      
      const pages = limit ? Math.ceil(total / limit) : 1;
      console.log(`Delivered ${rows.length} rows ${limit ? `(page ${page} of ${pages})` : '(all posts)'}`);
      
      // Return response with metadata
      res.json({
        posts: rows,
        pagination: {
          total,
          page: limit ? page : 1,
          limit: limit || total,
          pages: pages
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/posts/search', async (req, res) => {
    try {
      const db = getDb();
      const { q } = req.query;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const rawLimit = req.query.limit !== undefined ? parseInt(req.query.limit) : 20;
      
      // Special case: limit=0 means "return all posts"
      const limit = rawLimit === 0 ? null : Math.max(1, rawLimit);
      const offset = limit ? (page - 1) * limit : 0;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
      }

      const searchTerm = `%${q}%`;
      
      // Modified count query with authorAddress
      const countQuery = `
        SELECT COUNT(*) as total FROM posts
        WHERE LOWER(title) LIKE LOWER(?)
        OR LOWER(content) LIKE LOWER(?)
        OR LOWER(authorDisplayName) LIKE LOWER(?)
        OR LOWER(authorAddress) LIKE LOWER(?)
        OR LOWER(subplebbitAddress) LIKE LOWER(?)
      `;
      
      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get([searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
      
      // Modified search query with authorAddress (with limit)
      let searchQuery = `
        SELECT * FROM posts
        WHERE LOWER(title) LIKE LOWER(?)
        OR LOWER(content) LIKE LOWER(?)
        OR LOWER(authorDisplayName) LIKE LOWER(?)
        OR LOWER(authorAddress) LIKE LOWER(?)
        OR LOWER(subplebbitAddress) LIKE LOWER(?)
        ORDER BY rowid DESC
        LIMIT ? OFFSET ?
      `;
      let searchStmt = db.prepare(searchQuery);
      let rows;
      
      if (limit) {
        rows = searchStmt.all([searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);
      } else {
        // Modified search query with authorAddress (without limit)
        searchQuery = `
          SELECT * FROM posts
          WHERE LOWER(title) LIKE LOWER(?)
          OR LOWER(content) LIKE LOWER(?)
          OR LOWER(authorDisplayName) LIKE LOWER(?)
          OR LOWER(authorAddress) LIKE LOWER(?)
          OR LOWER(subplebbitAddress) LIKE LOWER(?)
          ORDER BY rowid DESC
        `;
        searchStmt = db.prepare(searchQuery);
        rows = searchStmt.all([searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
      }
      
      const pages = limit ? Math.ceil(total / limit) : 1;
      console.log(`Search results for "${q}" ${limit ? `(page ${page})` : '(all results)'}:`, rows.length);
      
      // Return response with metadata
      res.json({
        posts: rows,
        pagination: {
          total,
          page: limit ? page : 1,
          limit: limit || total,
          pages: pages
        }
      });
    } catch (err) {
      console.error('Error searching posts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add this middleware function after the imports and before the routes
  const requireAuth = (req, res, next) => {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    // Check for auth key in query parameters
    const authKey = req.query.auth;
    
    // Allow access if either token or auth key is valid
    if ((token && token === process.env.PLEBBIT_AUTH_TOKEN) || 
        (authKey && authKey === process.env.PLEBBIT_AUTH_KEY)) {
      return next();
    }
    
    return res.status(401).json({ error: 'Unauthorized - Invalid or missing authentication' });
  };

  // Modify the queue endpoints to use the middleware
  app.get('/api/queue', requireAuth, async (req, res) => {
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
  
  app.get('/api/queue/stats', requireAuth, async (req, res) => {
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
  
  app.post('/api/queue/add', requireAuth, express.json(), async (req, res) => {
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
  
  app.post('/api/queue/retry', requireAuth, express.json(), async (req, res) => {
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
  
  app.post('/api/queue/refresh', requireAuth, async (req, res) => {
    try {
      const db = getDb();
      const count = await refreshSubplebbitQueue(db);
      
      res.json({ success: true, message: `Queue refreshed with ${count} addresses` });
    } catch (err) {
      console.error('Error refreshing queue:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  app.post('/api/queue/process', requireAuth, async (req, res) => {
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

  app.get('/api/queue/errors', requireAuth, async (req, res) => {
    try {
      const db = getDb();
      
      const errorsQuery = `
        SELECT 
          address,
          status,
          error_message,
          failure_count,
          success_count,
          total_runs,
          updated_at
        FROM subplebbit_queue
        WHERE status = 'failed'
        ORDER BY failure_count DESC, updated_at DESC
      `;
      
      const stmt = db.prepare(errorsQuery);
      const rows = stmt.all();
      
      // Group by address
      const groupedErrors = rows.reduce((acc, row) => {
        if (!acc[row.address]) {
          acc[row.address] = {
            address: row.address,
            errors: [],
            total_failures: 0,
            total_successes: 0,
            total_runs: 0
          };
        }
        
        acc[row.address].errors.push({
          status: row.status,
          error_message: row.error_message,
          failure_count: row.failure_count,
          success_count: row.success_count,
          total_runs: row.total_runs,
          updated_at: row.updated_at
        });
        
        acc[row.address].total_failures += row.failure_count;
        acc[row.address].total_successes += row.success_count;
        acc[row.address].total_runs += row.total_runs;
        
        return acc;
      }, {});
      
      // Convert to array and sort by total failures
      const result = Object.values(groupedErrors).sort((a, b) => b.total_failures - a.total_failures);
      
      res.json(result);
    } catch (err) {
      console.error('Error fetching queue errors:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}