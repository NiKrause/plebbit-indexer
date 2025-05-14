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
  `);
  
  // Überprüfen, ob die Tabellen existieren
  const tablesCheck = {
    posts: dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'").get(),
    queue: dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subplebbit_queue'").get()
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
  
  return dbInstance;
}

// Hilfsfunktionen für die Subplebbit-Queue

/**
 * Fügt eine Adresse zur Queue hinzu oder aktualisiert sie, wenn sie bereits existiert
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
      WHERE status = 'failed'
  `);
  
  stmt.run(address, now, now, now, now, now);
}

/**
 * Aktualisiert den Status einer Adresse in der Queue
 */
export function updateSubplebbitStatus(db, address, status, errorMessage = null) {
  const now = Date.now();
  let nextRetryDate = null;
  
  // Wenn der Status 'failed' ist, berechne das nächste Wiederholungsdatum
  // basierend auf der Anzahl der Fehlversuche (exponentielles Backoff)
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
 * Holt die nächsten zu verarbeitenden Adressen aus der Queue
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
 * Fügt mehrere Adressen zur Queue hinzu
 */
export function queueMultipleSubplebbits(db, addresses) {
  const transaction = db.transaction((addressList) => {
    for (const address of addressList) {
      queueSubplebbit(db, address);
    }
  });
  
  transaction(addresses);
}
