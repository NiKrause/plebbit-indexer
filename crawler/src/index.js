import { getDb } from './db.js';
import { getPlebbitClient } from './plebbitClient.js';
import {
  initializeSubplebbitQueue,
  startQueueProcessor,
  refreshSubplebbitQueue
} from './subplebbit.js';
import { startServer } from './server/index.js';

/**
 * 1. we are starting a crawler which at first will get all the subplebbit addresses
 * 2. then it will open each subplebbit and get the posts
 * 3. it will save the posts to the database
 * 4. it will listen for updates on each subplebbit (and index in case of updates)
 * 5. it will do this indefinitely
 * 6. if the crawler is killed it will start from the beginning
 *
 * Todo:
 * - [x] create a nextjs app to view the posts
 * - [x] test subplebbit updates are indexed
 * - [x] test search functionality
 * - [x] write a test for the crawler
 * - [x] add a way to find new subplebbit address while the crawler is running (e.g. by daily searching github for new subplebbit repos, getting an event from the DAO smart contract, etc.)
 * - [x] if a subplebbit is erroring out, it should be written into another table so we can pick it up later
 *
 * TODO: (nice to have)
 * - [ ] add prometheus metrics for indexing speed, error rate, amount of posts indexed, amount of subplebbit listeners, etc.
 * - [ ] if a subplebbit is updated, it could be published to a pubsub topic so that other services can pick it up - question: is an ipns publish sufficient or should we use a pubsub topic?
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
  
  // Refresh the queue every 6 hours with new addresses from GitHub
  setInterval(() => {
    refreshSubplebbitQueue(db)
      .then(count => console.log(`Refreshed queue with ${count} addresses`))
      .catch(err => console.error('Error refreshing queue:', err));
  }, 6 * 60 * 60 * 1000);
  
  console.log("Crawler is running. Press Ctrl+C to stop.");
  process.stdin.resume();
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});