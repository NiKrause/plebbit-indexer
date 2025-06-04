// server.js (as ES Module)
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import { getDb, updateSubplebbitStatus, queueSubplebbit, takeModerationAction } from '../db.js';
import { refreshSubplebbitQueue, processSubplebbitQueue } from '../subplebbit.js';
import { getPlebbitClient } from '../plebbitClient.js';
import { initializeFlaggedPostsTable, flagPost } from '../contentModeration.js';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';

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
    
    // Initialize flagged_posts table
    initializeFlaggedPostsTable(db);
  } catch (err) {
    console.error('Error checking posts table:', err);
  }

  app.get('/api/posts', async (req, res) => {
    try {
      const db = getDb();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const rawLimit = req.query.limit !== undefined ? parseInt(req.query.limit) : 25;
      const sort = req.query.sort || 'new';
      const timeFilter = req.query.t || 'all';
      
      // Handle include-replies parameter - defaults to true
      let includeReplies = true; // Default to include replies
      if (req.query['include-replies'] !== undefined) {
        includeReplies = req.query['include-replies'] === 'true';
      }
      
      // Only fetch top-level posts (where parentCid is null) unless includeReplies is true
      const postFilter = includeReplies ? '' : 'p.parentCid IS NULL';
      
      // Special case: limit=0 means "return all posts"
      const limit = rawLimit === 0 ? null : Math.max(1, rawLimit);
      const offset = limit ? (page - 1) * limit : 0;
      
      console.log(`Getting posts ${limit ? `page ${page} with limit ${limit}` : 'with no limit'}, sort: ${sort}, timeFilter: ${timeFilter}, includeReplies: ${includeReplies}`);
      
      // Time filter conditions
      let whereClause = '';
      const timeParams = [];
      
      if (timeFilter !== 'all') {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        let timeOffset;
        
        switch (timeFilter) {
          case 'hour':
            timeOffset = 60 * 60;
            break;
          case 'day':
            timeOffset = 60 * 60 * 24;
            break;
          case 'week':
            timeOffset = 60 * 60 * 24 * 7;
            break;
          case 'month':
            timeOffset = 60 * 60 * 24 * 30;
            break;
          case 'year':
            timeOffset = 60 * 60 * 24 * 365;
            break;
          default:
            timeOffset = 0;
        }
        
        if (timeOffset > 0) {
          whereClause = ' WHERE p.timestamp > ?';
          if (!includeReplies) {
            whereClause += ' AND ' + postFilter;
          }
          timeParams.push(now - timeOffset);
        } else if (!includeReplies) {
          whereClause = ' WHERE ' + postFilter;
        }
      } else if (!includeReplies) {
        whereClause = ' WHERE ' + postFilter;
      }
      
      // Get total count for pagination metadata with time filter
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p
        LEFT JOIN posts parent ON p.parentCid = parent.id
        ${whereClause}
      `;
      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(timeParams);
      
      // Determine the sort order with table alias
      let orderClause;
      switch (sort) {
        case 'top':
          orderClause = 'ORDER BY (p.upvoteCount - p.downvoteCount) DESC, p.timestamp DESC';
          break;
        case 'replies':
          orderClause = 'ORDER BY p.replyCount DESC, p.timestamp DESC';
          break;
        case 'new':
          orderClause = 'ORDER BY p.timestamp DESC';
          break;
        case 'old':
          orderClause = 'ORDER BY p.timestamp ASC';
          break;
        default:
          orderClause = 'ORDER BY p.timestamp DESC'; // Default to 'new'
      }
      
      // Enhanced query with JOIN to get parent post information
      let postsQuery;
      let rows;
      
      const selectClause = `
        SELECT 
          p.*,
          parent.title as parentTitle,
          parent.authorDisplayName as parentAuthorDisplayName,
          parent.authorAddress as parentAuthorAddress,
          parent.replyCount as parentReplyCount
        FROM posts p
        LEFT JOIN posts parent ON p.parentCid = parent.id
        ${whereClause}
        ${orderClause}
      `;
      
      if (limit) {
        postsQuery = selectClause + ' LIMIT ? OFFSET ?';
        const allParams = [...timeParams, limit, offset];
        const postsStmt = db.prepare(postsQuery);
        rows = postsStmt.all(allParams);
      } else {
        postsQuery = selectClause;
        const postsStmt = db.prepare(postsQuery);
        rows = postsStmt.all(timeParams);
      }
      
      const pages = limit ? Math.ceil(total / limit) : 1;
      console.log(`Delivered ${rows.length} rows ${limit ? `(page ${page} of ${pages})` : '(all posts)'}`);
      
      // Return response with metadata including includeReplies
      res.json({
        posts: rows,
        pagination: {
          total,
          page: limit ? page : 1,
          limit: limit || total,
          pages: pages
        },
        filters: {
          sort,
          timeFilter,
          includeReplies
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
      const rawLimit = req.query.limit !== undefined ? parseInt(req.query.limit) : 25;
      const sort = req.query.sort || 'new';
      const timeFilter = req.query.t || 'all';
      
      // Handle include-replies parameter - defaults to true
      let includeReplies = true;
      if (req.query['include-replies'] !== undefined) {
        includeReplies = req.query['include-replies'] === 'true';
      }
      
      const limit = rawLimit === 0 ? null : Math.max(1, rawLimit);
      const offset = limit ? (page - 1) * limit : 0;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
      }

      const searchTerm = `%${q}%`;
      
      // Time filter conditions
      let whereClause = '';
      const timeParams = [];
      
      if (timeFilter !== 'all') {
        const now = Math.floor(Date.now() / 1000);
        let timeOffset;
        
        switch (timeFilter) {
          case 'hour': timeOffset = 60 * 60; break;
          case 'day': timeOffset = 60 * 60 * 24; break;
          case 'week': timeOffset = 60 * 60 * 24 * 7; break;
          case 'month': timeOffset = 60 * 60 * 24 * 30; break;
          case 'year': timeOffset = 60 * 60 * 24 * 365; break;
          default: timeOffset = 0;
        }
        
        if (timeOffset > 0) {
          whereClause = ' AND p.timestamp > ?';
          timeParams.push(now - timeOffset);
        }
      }
      
      // Add post filter for replies if needed
      let repliesClause = '';
      if (!includeReplies) {
        repliesClause = ' AND p.parentCid IS NULL';
      }
      
      // Determine the sort order with table alias
      let orderClause;
      switch (sort) {
        case 'top':
          orderClause = 'ORDER BY (p.upvoteCount - p.downvoteCount) DESC, p.timestamp DESC';
          break;
        case 'replies':
          orderClause = 'ORDER BY p.replyCount DESC, p.timestamp DESC';
          break;
        case 'new':
          orderClause = 'ORDER BY p.timestamp DESC';
          break;
        case 'old':
          orderClause = 'ORDER BY p.timestamp ASC';
          break;
        default:
          orderClause = 'ORDER BY p.timestamp DESC';
      }
      
      // Enhanced count query with JOIN to get accurate counts
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p
        LEFT JOIN posts parent ON p.parentCid = parent.id
        WHERE (LOWER(p.title) LIKE LOWER(?)
        OR LOWER(p.content) LIKE LOWER(?)
        OR LOWER(p.authorDisplayName) LIKE LOWER(?)
        OR LOWER(p.authorAddress) LIKE LOWER(?)
        OR LOWER(p.subplebbitAddress) LIKE LOWER(?)
        OR LOWER(parent.title) LIKE LOWER(?)
        OR LOWER(parent.authorDisplayName) LIKE LOWER(?)
        OR LOWER(parent.authorAddress) LIKE LOWER(?)
        OR LOWER(p.id) LIKE LOWER(?)
        OR LOWER(p.parentCid) LIKE LOWER(?))
        ${whereClause}${repliesClause}
      `;
      
      const countStmt = db.prepare(countQuery);
      const countParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, ...timeParams];
      const { total } = countStmt.get(countParams);
      
      // Enhanced search query with JOIN to get parent post information
      let searchQuery;
      let rows;
      
      const selectClause = `
        SELECT 
          p.*,
          parent.title as parentTitle,
          parent.authorDisplayName as parentAuthorDisplayName,
          parent.authorAddress as parentAuthorAddress,
          parent.replyCount as parentReplyCount
        FROM posts p
        LEFT JOIN posts parent ON p.parentCid = parent.id
        WHERE (LOWER(p.title) LIKE LOWER(?)
        OR LOWER(p.content) LIKE LOWER(?)
        OR LOWER(p.authorDisplayName) LIKE LOWER(?)
        OR LOWER(p.authorAddress) LIKE LOWER(?)
        OR LOWER(p.subplebbitAddress) LIKE LOWER(?)
        OR LOWER(parent.title) LIKE LOWER(?)
        OR LOWER(parent.authorDisplayName) LIKE LOWER(?)
        OR LOWER(parent.authorAddress) LIKE LOWER(?)
        OR LOWER(p.id) LIKE LOWER(?)
        OR LOWER(p.parentCid) LIKE LOWER(?))
        ${whereClause}${repliesClause}
        ${orderClause}
      `;
      
      if (limit) {
        searchQuery = selectClause + ' LIMIT ? OFFSET ?';
        const searchStmt = db.prepare(searchQuery);
        const searchParams = [
          searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
          ...timeParams, limit, offset
        ];
        rows = searchStmt.all(searchParams);
      } else {
        searchQuery = selectClause;
        const searchStmt = db.prepare(searchQuery);
        const searchParams = [
          searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
          ...timeParams
        ];
        rows = searchStmt.all(searchParams);
      }
      
      const pages = limit ? Math.ceil(total / limit) : 1;
      console.log(`Search results for "${q}" ${limit ? `(page ${page})` : '(all results)'} with sort=${sort}, timeFilter=${timeFilter}, includeReplies=${includeReplies}:`, rows.length);
      
      res.json({
        posts: rows,
        pagination: {
          total,
          page: limit ? page : 1,
          limit: limit || total,
          pages: pages
        },
        filters: {
          query: q,
          sort,
          timeFilter,
          includeReplies
        }
      });
    } catch (err) {
      console.error('Error searching posts:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/posts/:id', async (req, res) => {
    try {
      const db = getDb();
      const postId = req.params.id;
      
      // Enhanced query with JOIN to get parent post information
      const postStmt = db.prepare(`
        SELECT 
          p.*,
          parent.title as parentTitle,
          parent.authorDisplayName as parentAuthorDisplayName,
          parent.authorAddress as parentAuthorAddress,
          parent.replyCount as parentReplyCount
        FROM posts p
        LEFT JOIN posts parent ON p.parentCid = parent.id
        WHERE p.id = ?
      `);
      const post = postStmt.get(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json({ post });
    } catch (err) {
      console.error('Error fetching post:', err);
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
  
  app.post('/api/queue/process', requireAuth, express.json(), async (req, res) => {
    try {
      const { limit } = req.body || {};
      // Ensure limit is a positive number between 1 and 50
      const batchSize = limit ? Math.max(1, Math.min(50, parseInt(limit) || 1)) : 5;
      
      const db = getDb();
      const plebbit = await getPlebbitClient();
      
      // Process asynchronously to avoid blocking the API response
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

  // Get replies to a post or comment
  app.get('/api/replies/:parentCid', async (req, res) => {
    try {
      const db = getDb();
      const parentCid = req.params.parentCid;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.max(1, parseInt(req.query.limit) || 25);
      const sort = req.query.sort || 'new';
      const offset = (page - 1) * limit;
      
      // Determine the sort order with table alias
      let orderClause;
      switch (sort) {
        case 'top':
          orderClause = 'ORDER BY (r.upvoteCount - r.downvoteCount) DESC, r.timestamp DESC';
          break;
        case 'new':
          orderClause = 'ORDER BY r.timestamp DESC';
          break;
        case 'old':
          orderClause = 'ORDER BY r.timestamp ASC';
          break;
        default:
          orderClause = 'ORDER BY r.timestamp DESC';
      }
      
      // Count total replies
      const countStmt = db.prepare('SELECT COUNT(*) as total FROM posts WHERE parentCid = ?');
      const { total } = countStmt.get(parentCid);
      
      // Enhanced query with JOIN to get parent post information for each reply
      const repliesStmt = db.prepare(`
        SELECT 
          r.*,
          parent.title as parentTitle,
          parent.authorDisplayName as parentAuthorDisplayName,
          parent.authorAddress as parentAuthorAddress,
          parent.replyCount as parentReplyCount
        FROM posts r
        LEFT JOIN posts parent ON r.parentCid = parent.id
        WHERE r.parentCid = ? 
        ${orderClause} 
        LIMIT ? OFFSET ?
      `);
      const replies = repliesStmt.all(parentCid, limit, offset);
      
      const pages = Math.ceil(total / limit);
      
      res.json({
        replies,
        pagination: {
          total,
          page,
          limit,
          pages
        },
        filters: {
          sort
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/moderate/:id', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { action, auth } = req.body;
      
      // Check auth
      if (!auth || auth !== process.env.PLEBBIT_AUTH_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!action || !['ignore', 'deindex_comment', 'deindex_author', 'deindex_subplebbit'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }
      
      const db = getDb();
      const success = takeModerationAction(db, id, action, 'admin');
      console.log("takeModerationAction success", success);
      if (success) {
        const actionMessage = `Action ${action} taken on post ${id}`
        res.json({ success: true, message: actionMessage });
      } else {
        res.status(404).json({ error: 'Flagged post not found' });
      }
    } catch (err) {
      console.error('Error taking moderation action:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // API endpoint for flagged posts
  app.get('/api/flagged-posts', requireAuth, async (req, res) => {
    try {
      const db = getDb();
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = parseInt(req.query.limit) || 25;
      const offset = (page - 1) * limit;
      const flagReason = req.query.reason; // Optional filter by flag reason
      const status = req.query.status || 'pending'; // New status filter
      
      // Build WHERE clause based on filters
      let whereClause = '';
      const queryParams = [];
      
      if (status === 'pending') {
        whereClause = 'WHERE status = ?';
        queryParams.push('pending');
      } else if (status === 'moderated') {
        whereClause = 'WHERE status IN (?, ?, ?, ?)';
        queryParams.push('ignored', 'deindexed_comment', 'deindexed_author', 'deindexed_subplebbit');
      }
      
      if (flagReason) {
        whereClause += whereClause ? ' AND reason = ?' : 'WHERE reason = ?';
        queryParams.push(flagReason);
      }
      
      // Build queries with WHERE clause
      let countQuery = `SELECT COUNT(*) as total FROM flagged_posts ${whereClause}`;
      let postsQuery = `SELECT * FROM flagged_posts ${whereClause}`;
      
      // Add sorting
      postsQuery += ' ORDER BY flagged_at DESC LIMIT ? OFFSET ?';
      
      // Get total count
      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...queryParams);
      
      // Get flagged posts
      const postsStmt = db.prepare(postsQuery);
      const posts = postsStmt.all(...queryParams, limit, offset);
      
      const pages = Math.ceil(total / limit);
      
      res.json({
        flagged_posts: posts,
        pagination: {
          total,
          page,
          limit,
          pages
        },
        filters: {
          reason: flagReason || 'all',
          status
        }
      });
    } catch (err) {
      console.error('Error fetching flagged posts:', err);
      res.status(500).json({ error: err.message });
    }
  });
  
  // API endpoint for flagged posts statistics
  app.get('/api/flagged-posts/stats', requireAuth, async (req, res) => {
    try {
      const db = getDb();
      
      // Get counts for pending and moderated posts
      const pendingCountQuery = `
        SELECT COUNT(*) as count 
        FROM flagged_posts 
        WHERE status = 'pending'
      `;
      const pendingCount = db.prepare(pendingCountQuery).get().count;
      
      const moderatedCountQuery = `
        SELECT COUNT(*) as count 
        FROM flagged_posts 
        WHERE status IN ('ignored', 'deindexed_comment', 'deindexed_author', 'deindexed_subplebbit')
      `;
      const moderatedCount = db.prepare(moderatedCountQuery).get().count;
      
      // Get stats by reason
      const statsQuery = `
        SELECT
          reason,
          COUNT(*) as count
        FROM flagged_posts
        GROUP BY reason
      `;
      
      const stmt = db.prepare(statsQuery);
      const stats = stmt.all();
      
      const totalQuery = 'SELECT COUNT(*) as total FROM flagged_posts';
      const totalStmt = db.prepare(totalQuery);
      const { total } = totalStmt.get();
      
      res.json({
        total,
        pending: pendingCount,
        moderated: moderatedCount,
        stats
      });
    } catch (err) {
      console.error('Error fetching flagged posts stats:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * Flag a post for content moderation
   * 
   * @route POST /api/posts/:id/flag
   * @description Flags a post with a specific reason for content moderation review.
   * The flagged post will be added to the moderation queue for admin review.
   * 
   * @param {string} id - The unique identifier of the post to flag (URL parameter)
   * @param {Object} req.body - Request body containing flag details
   * @param {string} req.body.reason - The reason for flagging the post (required)
   * 
   * @returns {Object} 200 - Success response
   * @returns {boolean} returns.success - Indicates if the operation was successful
   * @returns {string} returns.message - Success message with post ID and reason
   * 
   * @returns {Object} 400 - Bad Request - Missing or invalid reason
   * @returns {string} returns.error - Error message indicating missing reason
   * 
   * @returns {Object} 404 - Not Found - Post doesn't exist or flagging failed
   * @returns {string} returns.error - Error message indicating post not found
   * 
   * @returns {Object} 500 - Internal Server Error
   * @returns {string} returns.error - Error message describing the server error
   * 
   * @example
   * // Flag a post for spam
   * curl -X POST http://localhost:3001/api/posts/QmExamplePostId123/flag \
   *   -H "Content-Type: application/json" \
   *   -d '{"reason": "spam"}'
   * 
   * @example
   * // Flag a post for inappropriate content
   * curl -X POST http://localhost:3001/api/posts/QmAnotherPostId456/flag \
   *   -H "Content-Type: application/json" \
   *   -d '{"reason": "inappropriate content"}'
   * 
   * @example
   * // Success response
   * {
   *   "success": true,
   *   "message": "Post QmExamplePostId123 flagged with reason: spam"
   * }
   * 
   * @example
   * // Error response - missing reason
   * {
   *   "error": "Flag reason is required"
   * }
   * 
   * @example
   * // Error response - post not found
   * {
   *   "error": "Post not found or flagging failed"
   * }
   * 
   * @since 1.0.0
   * @author Plebbit Indexer Team
   */
  // app.post('/api/posts/:id/flag', requireAuth, express.json(), async (req, res) => {
    app.post('/api/posts/:id/flag', express.json(), async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ error: 'Flag reason is required' });
      }
      
      const db = getDb();
      const success = await flagPost(db, id, reason);
      
      if (success) {
        res.json({ success: true, message: `Post ${id} flagged with reason: ${reason}` });
      } else {
        res.status(404).json({ error: 'Post not found or flagging failed' });
      }
    } catch (err) {
      console.error('Error flagging post:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete a post endpoint  
  app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const db = getDb();
      
      // Check if post exists
      const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Delete the post
      const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
      const result = deleteStmt.run(id);
      
      if (result.changes > 0) {
        res.json({ success: true, message: `Post ${id} deleted successfully` });
      } else {
        res.status(500).json({ error: 'Failed to delete post' });
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Modify the existing sitemap endpoint to serve as sitemap index
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const db = getDb();
      
      // Get total count of posts
      const { total } = db.prepare(`
        SELECT COUNT(*) as total 
        FROM posts 
        WHERE parentCid IS NULL
      `).get();
      
      // Calculate number of sitemaps needed (50,000 URLs per sitemap)
      const urlsPerSitemap = 50000;
      const numSitemaps = Math.ceil(total / urlsPerSitemap);
      
      // Create sitemap index stream
      const stream = new SitemapStream({ 
        hostname: process.env.NEXT_PUBLIC_APP_URL || 'https://plebscan.com' 
      });
      
      // Add static routes to first sitemap
      stream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
      stream.write({ url: '/search', changefreq: 'daily', priority: 0.8 });
      
      // Add sitemap index entries
      for (let i = 0; i < numSitemaps; i++) {
        stream.write({
          url: `/sitemap-${i + 1}.xml`,
          changefreq: 'daily',
          priority: 0.5
        });
      }
      
      // End the stream
      stream.end();
      
      // Convert to XML and compress
      const sitemap = await streamToPromise(stream);
      const gzip = createGzip();
      
      // Set headers
      res.header('Content-Type', 'application/xml');
      res.header('Content-Encoding', 'gzip');
      
      // Send the response
      gzip.end(sitemap);
      gzip.pipe(res);
      
    } catch (err) {
      console.error('Error generating sitemap index:', err);
      res.status(500).send('Error generating sitemap index');
    }
  });

  // Add new endpoint for individual sitemap files
  app.get('/sitemap-:index.xml', async (req, res) => {
    try {
      const db = getDb();
      const index = parseInt(req.params.index);
      const urlsPerSitemap = 50000;
      const offset = (index - 1) * urlsPerSitemap;
      
      // Get posts for this sitemap
      const posts = db.prepare(`
        SELECT id, timestamp, subplebbitAddress 
        FROM posts 
        WHERE parentCid IS NULL 
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `).all(urlsPerSitemap, offset);
      
      // Create sitemap stream
      const stream = new SitemapStream({ 
        hostname: process.env.NEXT_PUBLIC_APP_URL || 'https://plebscan.com' 
      });
      
      // Add post routes
      posts.forEach(post => {
        stream.write({
          url: `/p/${post.subplebbitAddress}/c/${post.id}`,
          changefreq: 'daily',
          priority: 0.7,
          lastmod: new Date(post.timestamp * 1000).toISOString()
        });
      });
      
      // End the stream
      stream.end();
      
      // Convert to XML and compress
      const sitemap = await streamToPromise(stream);
      const gzip = createGzip();
      
      // Set headers
      res.header('Content-Type', 'application/xml');
      res.header('Content-Encoding', 'gzip');
      
      // Send the response
      gzip.end(sitemap);
      gzip.pipe(res);
      
    } catch (err) {
      console.error('Error generating sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}