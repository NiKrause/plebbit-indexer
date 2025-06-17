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
    verbose: process.env.ENABLE_SQL_LOGGING === 'true' ? console.log : null
  });
  
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      subplebbitAddress TEXT NOT NULL,
      authorAddress TEXT,
      authorDisplayName TEXT,
      upvoteCount INTEGER,
      downvoteCount INTEGER,
      replyCount INTEGER,
      parentCid TEXT,
      postCid TEXT,
      depth INTEGER DEFAULT 0,
      moderated_at INTEGER
    );
    
    -- Indizes für häufige Abfragen
    CREATE INDEX IF NOT EXISTS idx_posts_subplebbit ON posts(subplebbitAddress);
    CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parentCid);
    CREATE INDEX IF NOT EXISTS idx_posts_post ON posts(postCid);

    -- Queue-Tabelle für Subplebbit-Adressen
    CREATE TABLE IF NOT EXISTS subplebbit_queue (
      address TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'queued', -- queued, processing, success, failed
      last_success_date INTEGER,
      last_failed_date INTEGER,
      next_retry_date INTEGER,
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      total_runs INTEGER DEFAULT 0,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    -- Index für die Queue-Tabelle
    CREATE INDEX IF NOT EXISTS idx_subplebbit_queue_status ON subplebbit_queue(status);
    CREATE INDEX IF NOT EXISTS idx_subplebbit_queue_next_retry ON subplebbit_queue(next_retry_date);

    -- Flagged posts table for content moderation
    CREATE TABLE IF NOT EXISTS flagged_posts (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      subplebbitAddress TEXT NOT NULL,
      authorAddress TEXT,
      authorDisplayName TEXT,
      upvoteCount INTEGER,
      downvoteCount INTEGER,
      replyCount INTEGER,
      parentCid TEXT,
      postCid TEXT,
      depth INTEGER DEFAULT 0,
      harm INTEGER,
      reason TEXT,
      category TEXT,
      flagged_at INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',  -- 'pending', 'ignored', 'deindexed_comment', 'deindexed_author', 'deindexed_subplebbit'
      moderation_action TEXT,         -- null, 'ignore', 'deindex_comment', 'deindex_author', 'deindex_subplebbit'
      moderated_at INTEGER,           -- timestamp when moderation action was taken
      moderated_by TEXT               -- identifier of who took the action (for audit trail)
    );

    -- Combined index for timestamp + subplebbitAddress
    CREATE INDEX IF NOT EXISTS idx_posts_subplebbit_timestamp ON posts(subplebbitAddress, timestamp);

    -- Index on authorAddress for searching user's posts
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(authorAddress);

    -- Combined index for parentCid + timestamp for sorting replies chronologically
    CREATE INDEX IF NOT EXISTS idx_posts_parent_timestamp ON posts(parentCid, timestamp);

    -- Composite indexes for sorting performance in posts endpoints
    CREATE INDEX IF NOT EXISTS idx_posts_votes_timestamp ON posts((upvoteCount - downvoteCount) DESC, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_replies_timestamp ON posts(replyCount DESC, timestamp DESC);

    -- Search performance indexes (case-insensitive)
    CREATE INDEX IF NOT EXISTS idx_posts_title_lower ON posts(LOWER(title)) WHERE title IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_posts_content_lower ON posts(LOWER(content)) WHERE content IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_posts_author_display_lower ON posts(LOWER(authorDisplayName)) WHERE authorDisplayName IS NOT NULL;

    -- Queue table performance indexes
    CREATE INDEX IF NOT EXISTS idx_subplebbit_queue_updated_at ON subplebbit_queue(updated_at);
    CREATE INDEX IF NOT EXISTS idx_subplebbit_queue_failure_updated ON subplebbit_queue(failure_count DESC, updated_at DESC);

    -- Combined index for better time filtering with replies
    CREATE INDEX IF NOT EXISTS idx_posts_parent_timestamp_filter ON posts(parentCid, timestamp) WHERE parentCid IS NULL;

    -- Additional composite index for queue processing
    CREATE INDEX IF NOT EXISTS idx_subplebbit_queue_status_retry ON subplebbit_queue(status, next_retry_date);

    -- Indexes for flagged posts
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_reason ON flagged_posts(reason);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_timestamp ON flagged_posts(timestamp);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_flagged_at ON flagged_posts(flagged_at);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_status ON flagged_posts(status);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_moderation_action ON flagged_posts(moderation_action);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_subplebbit ON flagged_posts(subplebbitAddress);
    CREATE INDEX IF NOT EXISTS idx_flagged_posts_author ON flagged_posts(authorAddress);

    -- Known subplebbits table for tracking discovered subplebbits
    CREATE TABLE IF NOT EXISTS known_subplebbits (
      address TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      discovered_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      tags TEXT
    );
  `);
  
  // Check if title column is NOT NULL and fix if needed
  const checkTitleNullable = () => {
    console.log("Checking if title column is nullable...");
    const tableInfo = dbInstance.prepare("PRAGMA table_info(posts)").all();
    const titleColumn = tableInfo.find(col => col.name === 'title');
    
    if (titleColumn && titleColumn.notnull === 1) {
      console.log("Title column has NOT NULL constraint. Modifying to be nullable...");
      
      // Start a transaction
      dbInstance.pragma('foreign_keys = OFF');
      dbInstance.prepare('BEGIN TRANSACTION').run();
      
      try {
        // Make the title column nullable
        dbInstance.exec('ALTER TABLE posts RENAME COLUMN title TO title_old');
        dbInstance.exec('ALTER TABLE posts ADD COLUMN title TEXT');
        dbInstance.exec('UPDATE posts SET title = title_old');
        dbInstance.exec('ALTER TABLE posts DROP COLUMN title_old');
        
        dbInstance.prepare('COMMIT').run();
        console.log("Successfully made title column nullable");
      } catch (error) {
        dbInstance.prepare('ROLLBACK').run();
        console.error("Error modifying title column:", error.message);
      } finally {
        dbInstance.pragma('foreign_keys = ON');
      }
    } else {
      console.log("Title column is already nullable. No changes needed.");
    }
  };
  
  // Run the title nullable check
  checkTitleNullable();
  
  // Check if moderated_at column exists and add if missing
  const checkModeratedAtColumn = () => {
    console.log("Checking if moderated_at column exists...");
    const tableInfo = dbInstance.prepare("PRAGMA table_info(posts)").all();
    const moderatedAtColumn = tableInfo.find(col => col.name === 'moderated_at');
    
    if (!moderatedAtColumn) {
      console.log("moderated_at column missing. Adding column...");
      
      // Start a transaction
      dbInstance.pragma('foreign_keys = OFF');
      dbInstance.prepare('BEGIN TRANSACTION').run();
      
      try {
        // Add the moderated_at column
        dbInstance.exec('ALTER TABLE posts ADD COLUMN moderated_at INTEGER');
        
        dbInstance.prepare('COMMIT').run();
        console.log("Successfully added moderated_at column");
      } catch (error) {
        dbInstance.prepare('ROLLBACK').run();
        console.error("Error adding moderated_at column:", error.message);
      } finally {
        dbInstance.pragma('foreign_keys = ON');
      }
    } else {
      console.log("moderated_at column exists. No changes needed.");
    }
  };
  
  // Run the moderated_at column check
  checkModeratedAtColumn();
  
  const checkTagsColumn = () => {
    console.log("Checking if tags column exists in known_subplebbits...");
    const tableInfo = dbInstance.prepare("PRAGMA table_info(known_subplebbits)").all();
    const tagsColumn = tableInfo.find(col => col.name === 'tags');
    
    if (!tagsColumn) {
      console.log("tags column missing. Adding column...");
      
      // Start a transaction
      dbInstance.pragma('foreign_keys = OFF');
      dbInstance.prepare('BEGIN TRANSACTION').run();
      
      try {
        // Add the tags column
        dbInstance.exec('ALTER TABLE known_subplebbits ADD COLUMN tags TEXT');
        
        dbInstance.prepare('COMMIT').run();
        console.log("Successfully added tags column");
      } catch (error) {
        dbInstance.prepare('ROLLBACK').run();
        console.error("Error adding tags column:", error.message);
      } finally {
        dbInstance.pragma('foreign_keys = ON');
      }
    } else {
      console.log("tags column exists. No changes needed.");
    }
  };
  
  // Run the tags column check
  checkTagsColumn();
  
  const tablesCheck = {
    posts: dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'").get(),
    queue: dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subplebbit_queue'").get(),
    flagged_posts: dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='flagged_posts'").get()
  };
  
  if (!tablesCheck.posts) {
    throw new Error('Failed to create posts table');
  } else {
    console.log("posts table is available");
  }
  
  if (!tablesCheck.queue) {
    throw new Error('Failed to create subplebbit_queue table');
  } else {
    console.log("subplebbit_queue table is available");
  }
  
  if (!tablesCheck.flagged_posts) {
    throw new Error('Failed to create flagged_posts table');
  } else {
    console.log("flagged_posts table is available");
  }
  
  return dbInstance;
}


/**
 */
export function queueSubplebbit(db, address) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO subplebbit_queue (address, status, created_at, updated_at, next_retry_date)
    VALUES (?, 'queued', ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      status = 'queued',
      updated_at = ?,
      next_retry_date = ?
  `);
  
  stmt.run(address, now, now, now, now, now);
}

/**
 */
export function updateSubplebbitStatus(db, address, status, errorMessage = null) {
  const now = Date.now();
  let nextRetryDate = null;
  
  if (status === 'failed') {
    const currentFailures = db.prepare('SELECT failure_count FROM subplebbit_queue WHERE address = ?').get(address)?.failure_count || 0;
    const retryHours = Math.min(Math.pow(2, currentFailures), 24); // Max 24 Stunden Wartezeit
    nextRetryDate = now + (retryHours * 60 * 60 * 1000);
  }
  
  const stmt = db.prepare(`
    UPDATE subplebbit_queue
    SET status = ?,
        updated_at = ?,
        ${status === 'success' ? 'last_success_date = ?, success_count = success_count + 1,' : ''}
        ${status === 'failed' ? 'last_failed_date = ?, failure_count = failure_count + 1, error_message = ?,' : ''}
        ${nextRetryDate ? 'next_retry_date = ?,' : ''}
        total_runs = total_runs + 1
    WHERE address = ?
  `);
  
  if (status === 'success') {
    stmt.run(status, now, now, address);
  } else if (status === 'failed') {
    stmt.run(status, now, now, errorMessage, nextRetryDate, address);
  } else {
    stmt.run(status, now, address);
  }
}

/**

 */
export function getNextSubplebbitsFromQueue(db, limit = 10) {
  const now = Date.now();
  
  return db.prepare(`
    SELECT * FROM subplebbit_queue
    WHERE (status = 'queued')
       OR (status = 'failed' AND next_retry_date <= ?)
    ORDER BY
      CASE
        WHEN status = 'queued' THEN 0
        ELSE 1
      END,
      next_retry_date ASC
    LIMIT ?
  `).all(now, limit);
}

/**
 * Queue multiple subplebbit addresses
 */
export function queueMultipleSubplebbits(db, addresses) {
  console.log('[Queue] Starting to queue multiple subplebbits');
  // Filter out null/undefined addresses
  const validAddresses = addresses.filter(address => address != null);
  
  if (validAddresses.length !== addresses.length) {
    console.log(`[Queue] Filtered out ${addresses.length - validAddresses.length} null/undefined addresses`);
  }
  
  console.log(`[Queue] Queueing ${validAddresses.length} valid addresses`);
  const transaction = db.transaction((addressList) => {
    for (const address of addressList) {
      if (isSubplebbitBlacklisted(db, address)) {
        console.log(`[Queue] Skipping blacklisted address: ${address}`);
        continue;
      }
      console.log(`[Queue] Adding address to queue: ${address}`);
      queueSubplebbit(db, address);
    }
  });
  
  transaction(validAddresses);
  console.log('[Queue] Finished queueing subplebbits');
}

/**
 * Check if a subplebbit is blacklisted
 */
export function isSubplebbitBlacklisted(db, subplebbitAddress) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM flagged_posts 
    WHERE subplebbitAddress = ? AND moderation_action = 'deindex_subplebbit'
  `);
  const result = stmt.get(subplebbitAddress);
  return result.count > 0;
}

/**
 * Check if an author is blacklisted
 */
export function isAuthorBlacklisted(db, authorAddress) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM flagged_posts 
    WHERE authorAddress = ? AND moderation_action = 'deindex_author'
  `);
  const result = stmt.get(authorAddress);
  return result.count > 0;
}



/**
 * Check if a specific comment is deindexed (should not be re-indexed)
 */
export function isCommentDeindexed(db, postId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM flagged_posts 
    WHERE id = ? AND moderation_action IN ('deindex_comment', 'deindex_author', 'deindex_subplebbit')
  `);
  const result = stmt.get(postId);
  return result.count > 0;
}

/**
 * Take moderation action on a flagged post
 */
export function takeModerationAction(db, flaggedPostId, action, moderatedBy = 'system') {
  console.log("takeModerationAction", flaggedPostId, action, moderatedBy);
  const now = Date.now();
  
  const transaction = db.transaction(() => {
    // First, get the flagged post info
    //console log all flagged_posts
    const flaggedPosts = db.prepare('SELECT * FROM flagged_posts').all();
    console.log("flaggedPosts", flaggedPosts);
    const flaggedPost = db.prepare('SELECT * FROM flagged_posts WHERE id = ?').get(flaggedPostId);
    if (!flaggedPost) {
      const deleteStmt = db.prepare(`
        DELETE FROM flagged_posts 
        WHERE id = null
      `);
      deleteStmt.run();
      return false;
    }
    console.log("flaggedPost found", flaggedPost);
    
    // Update the flagged_posts table with the action
    const statusMap = {
      'ignore': 'ignored',
      'deindex_comment': 'deindexed_comment',
      'deindex_author': 'deindexed_author',
      'deindex_subplebbit': 'deindexed_subplebbit'
    };
    
    const status = statusMap[action] || 'pending';

    const updateStmt = db.prepare(`
      UPDATE flagged_posts 
      SET status = ?, moderation_action = ?, moderated_at = ?, moderated_by = ?
      WHERE id = ?
    `);
    updateStmt.run(status, action, now, moderatedBy, flaggedPostId);
    console.log("flagged_posts table updated", status, action, now, moderatedBy, flaggedPostId);
    
    // Now handle the deletion actions
    if (action === 'deindex_comment') {
      // Delete this specific post
      const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
      deleteStmt.run(flaggedPostId);
      console.log(`Deleted post ${flaggedPostId}`);
      
    } else if (action === 'deindex_author') {
      // Delete all posts from this author
      const deleteStmt = db.prepare('DELETE FROM posts WHERE authorAddress = ?');
      const result = deleteStmt.run(flaggedPost.authorAddress);
      console.log(`Deleted ${result.changes} posts from author ${flaggedPost.authorAddress}`);
      
    } else if (action === 'deindex_subplebbit') {
      // Delete all posts from this subplebbit
      const deleteStmt = db.prepare('DELETE FROM posts WHERE subplebbitAddress = ?');
      const result = deleteStmt.run(flaggedPost.subplebbitAddress);
      console.log(`Deleted ${result.changes} posts from subplebbit ${flaggedPost.subplebbitAddress}`);
    }
    // 'ignore' action does nothing to the posts table
    
    return true;
  });
  
  return transaction();
}

// Add this function to clean up null addresses
export function cleanupNullAddresses(db) {
  const stmt = db.prepare(`
    DELETE FROM subplebbit_queue 
    WHERE address IS NULL
  `);
  const result = stmt.run();
  console.log(`Cleaned up ${result.changes} null addresses from queue`);
  return result.changes;
}
