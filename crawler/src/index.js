import { getDb } from './db.js';
import { getPlebbitClient } from './plebbitClient.js';
import {
  initializeSubplebbitQueue,
  startQueueProcessor,
  refreshSubplebbitQueue
} from './subplebbit.js';
import { startServer } from './server/index.js';
import { startContentModerationScheduler } from './contentModeration.js';

/**
 * 1. we are starting a crawler which at first will get all the subplebbit addresses
 * 2. then it will open each subplebbit and get the posts
 * 3. it will save the posts to the database
 * 4. it will listen for updates on each subplebbit (and index in case of updates)
 * 5. it will do this indefinitely
 * 6. if the crawler is killed it will start from the beginning
 *
 */
async function main() {
  await startServer(); // starts the server on port 3001

  const db = getDb();
  const plebbit = await getPlebbitClient();
  
  // Initialize the queue with addresses from GitHub
  const queuedCount = await initializeSubplebbitQueue(db);
  console.log(`Initialized queue with ${queuedCount} subplebbit addresses`);
  
  // Start the queue processor, which runs every 15 minutes
  startQueueProcessor(plebbit, db, 15);
  
  // Refresh the queue with configurable interval (in hours) with new addresses from GitHub
  const refreshIntervalHours = parseInt(process.env.QUEUE_REFRESH_INTERVAL || '6', 10);
  setInterval(() => {
    refreshSubplebbitQueue(db)
      .then(count => console.log(`Refreshed queue with ${count} addresses`))
      .catch(err => console.error('Error refreshing queue:', err));
  }, refreshIntervalHours * 60 * 60 * 1000);
  
  // Start content moderation scheduler if enabled
  if (process.env.ENABLE_CONTENT_MODERATION === 'true') {
    const moderationInterval = parseInt(process.env.CONTENT_MODERATION_INTERVAL || '30', 10);
    startContentModerationScheduler(moderationInterval);
    console.log('Content moderation enabled, running every', moderationInterval, 'minutes');
  } else {
    console.log('Content moderation is disabled');
  }
  
  console.log("Crawler is running. Press Ctrl+C to stop.");
  process.stdin.resume();
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});