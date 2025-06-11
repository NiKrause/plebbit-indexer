import { getDb } from './db.js';
import { queueMultipleSubplebbits } from './db.js';

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const DUNE_QUERY_ID = process.env.DUNE_QUERY_ID || '5261403'; // Fallback to default if not set
const DUNE_API_BASE = 'https://api.dune.com/api/v1';

/**
 * Execute the Dune query to refresh results
 */
export async function executeDuneQuery() {
  if (!DUNE_API_KEY) {
    throw new Error('DUNE_API_KEY environment variable is required');
  }

  console.log('Starting Dune query execution...');
  try {
    const response = await fetch(`${DUNE_API_BASE}/query/${DUNE_QUERY_ID}/execute`, {
      method: 'POST',
      headers: {
        'X-Dune-API-Key': DUNE_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Dune query execution failed with status: ${response.status}`);
      throw new Error(`Failed to execute Dune query: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Dune query execution initiated successfully:', {
      executionId: data.execution_id,
      status: data.state,
      timestamp: new Date().toISOString()
    });
    return data;
  } catch (error) {
    console.error('Error executing Dune query:', error.message);
    throw error;
  }
}

/**
 * Fetch results from the Dune query
 */
export async function fetchDuneResults() {
  if (!DUNE_API_KEY) {
    throw new Error('DUNE_API_KEY environment variable is required');
  }

  try {
    const response = await fetch(`${DUNE_API_BASE}/query/${DUNE_QUERY_ID}/results?limit=1000`, {
      headers: {
        'X-Dune-API-Key': DUNE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Dune results: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.rows;
  } catch (error) {
    console.error('Error fetching Dune results:', error);
    throw error;
  }
}

/**
 * Add new subplebbits from Dune results to the queue
 */
export async function processDuneResults(db) {
  console.log('Starting to process Dune results...');
  try {
    // Clean up invalid entries before processing new results
    cleanupInvalidSubplebbits(db);
    
    const results = await fetchDuneResults();
    console.log(`Retrieved ${results.length} results from Dune`);
    const newAddresses = [];
    
    // Process each result
    for (const row of results) {
      const address = row.name; // Make sure this matches the actual field name from Dune
      
      if (!address) {
        console.log('Skipping result with no address:', row);
        continue;
      }
      
      // Check if we already know about this subplebbit
      const knownStmt = db.prepare('SELECT address FROM known_subplebbits WHERE address = ?');
      const known = knownStmt.get(address);
      
      if (!known) {
        console.log(`Found new subplebbit: ${address}`);
        // Add to known subplebbits
        const insertStmt = db.prepare(`
          INSERT OR IGNORE INTO known_subplebbits (address, source, discovered_at, last_seen_at)
          VALUES (?, 'dune', ?, ?)
        `);
        const now = Date.now();
        insertStmt.run(address, now, now);
        
        newAddresses.push(address);
      } else {
        // Update last_seen_at
        const updateStmt = db.prepare(`
          UPDATE known_subplebbits 
          SET last_seen_at = ? 
          WHERE address = ?
        `);
        updateStmt.run(Date.now(), address);
      }
    }
    
    // Queue new addresses for processing
    if (newAddresses.length > 0) {
      console.log(`Found ${newAddresses.length} new subplebbits from Dune`);
      console.log('New addresses:', newAddresses);
      queueMultipleSubplebbits(db, newAddresses);
    } else {
      console.log('No new subplebbits found in this batch');
    }
    
    return newAddresses.length;
  } catch (error) {
    console.error('Error processing Dune results:', error.message);
    throw error;
  }
}

export function cleanupKnownSubplebbits(db) {
  console.log('Cleaning up known_subplebbits table...');
  
  // First, get all duplicate addresses
  const duplicatesQuery = `
    SELECT address, COUNT(*) as count
    FROM known_subplebbits
    GROUP BY address
    HAVING COUNT(*) > 1
  `;
  
  const duplicates = db.prepare(duplicatesQuery).all();
  console.log(`Found ${duplicates.length} addresses with duplicates`);
  
  // For each duplicate, keep the most recent entry and delete others
  for (const dup of duplicates) {
    const cleanupQuery = `
      DELETE FROM known_subplebbits
      WHERE address = ?
      AND rowid NOT IN (
        SELECT MAX(rowid)
        FROM known_subplebbits
        WHERE address = ?
      )
    `;
    
    const stmt = db.prepare(cleanupQuery);
    const result = stmt.run(dup.address, dup.address);
    console.log(`Cleaned up ${result.changes} duplicate entries for address ${dup.address}`);
  }
  
  // Add a unique constraint to prevent future duplicates
  try {
    const addConstraintQuery = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_known_subplebbits_address 
      ON known_subplebbits(address)
    `;
    db.prepare(addConstraintQuery).run();
    console.log('Added unique constraint on address column');
  } catch (err) {
    console.error('Error adding unique constraint:', err);
  }
}

export function cleanupInvalidSubplebbits(db) {
  console.log('Cleaning up invalid entries from known_subplebbits table...');
  
  const cleanupQuery = `
    DELETE FROM known_subplebbits 
    WHERE address IS NULL 
    OR address = '' 
    OR source IS NULL 
    OR source = ''
  `;
  
  const stmt = db.prepare(cleanupQuery);
  const result = stmt.run();
  console.log(`Cleaned up ${result.changes} invalid entries from known_subplebbits`);
  return result.changes;
}