import { indexPosts } from './indexer.js';
import { withTimeout } from './utils.js';
import { queueMultipleSubplebbits, getNextSubplebbitsFromQueue, updateSubplebbitStatus } from './db.js';

/**
 * Fetches subplebbit addresses from GitHub and adds them to the queue
 */
export async function getSubplebbitAddresses() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/plebbit/temporary-default-subplebbits/master/multisub.json');
    const subplebbitList = await response.json();
    const addresses = subplebbitList.subplebbits.map(item => item.address);
    return addresses;
  } catch (error) {
    console.error('Error fetching subplebbit addresses:', error);
    return [];
  }
}

/**
 * Initializes the queue with addresses from GitHub
 */
export async function initializeSubplebbitQueue(db) {
  const addresses = await getSubplebbitAddresses();
  if (addresses.length > 0) {
    console.log(`Queueing ${addresses.length} subplebbit addresses...`);
    queueMultipleSubplebbits(db, addresses);
  }
  return addresses.length;
}

/**
 * Processes the next subplebbits from the queue
 */
export async function processSubplebbitQueue(plebbit, db, batchSize = 10) {
  const queueItems = getNextSubplebbitsFromQueue(db, batchSize);
  console.log(`Processing ${queueItems.length} subplebbits from queue...`);
  
  const subs = [];
  for (const item of queueItems) {
    const { address } = item;
    try {
      // Mark as "in progress"
      updateSubplebbitStatus(db, address, 'processing');
      
      const sub = await withTimeout(
        plebbit.getSubplebbit(address),
        10000,
        `Timeout getting subplebbit at ${address}`
      );
      
      await withTimeout(
        sub.update(),
        10000,
        `Timeout updating subplebbit at ${address}`
      );
      
      console.log(`Indexing subplebbit at ${address}`);
      await indexSubplebbit(sub, db);
      
      // Mark as successful
      updateSubplebbitStatus(db, address, 'success');
      
      // Set up listener for updates
      setupSubplebbitListener(sub, db, address);
      
      subs.push(sub);
    } catch (err) {
      console.error(`Error processing subplebbit at address ${address}:`, err);
      // Mark as failed with error message
      updateSubplebbitStatus(db, address, 'failed', err.message || 'Unknown error');
    }
  }
  
  return subs;
}

/**
 * Sets up a listener for a single subplebbit
 */
export function setupSubplebbitListener(sub, db, address) {
  // Listen for errors on this subplebbit
  sub.on('error', (err) => {
    console.error(`Subplebbit error event for ${address}:`, err);
    updateSubplebbitStatus(db, address, 'failed', err.message || 'Error event');
  });

  // Listen for updates
  sub.on('update', async () => {
    console.log(`Subplebbit ${address} updated, re-indexing...`);
    try {
      await withTimeout(
        sub.update(),
        10000,
        `Timeout updating subplebbit at ${address} (on update event)`
      );
      await indexSubplebbit(sub, db);
      updateSubplebbitStatus(db, address, 'success');
    } catch (err) {
      console.error(`Error updating/indexing subplebbit at ${address} (on update event):`, err);
      updateSubplebbitStatus(db, address, 'failed', err.message || 'Update event error');
    }
  });
}

export async function indexSubplebbit(sub, db) {
  if (Object.keys(sub.posts.pageCids).length === 0) return Object.values(sub.posts.pages)[0].comments; // no need to fetch page cids, just use the preloaded page
  let postsPage = await sub.posts.getPage(sub.posts.pageCids.new);
  // console.log("postsPage", postsPage);
  let allPosts = [...postsPage.comments];
  // const lastPostIndexed = await db.getLastPostIndexed(sub.address);
  while (postsPage.nextCid) {
    try {
      postsPage = await sub.posts.getPage(postsPage.nextCid);
      allPosts = allPosts.concat(postsPage.comments);

        // if (lastPostIndexed && allPosts.some(post => post.cid === lastPostIndexed)) {
        //   // no need to keep going and load new pages as we've reached the last post indexed
        //   // 'new' is sorted by post creation time, so if we've reached the last post indexed, there's no new posts to index
        //   break;
        // }
    } catch (err) {
      console.error(`Error loading next page (${postsPage.nextCid}):`, err);
      break;
    }
  }
  console.log("now indexing ", allPosts.length, " posts");
  await indexPosts(db, allPosts);
}

/**
 * Sets up listeners for all subplebbits (Legacy method, now uses queue)
 */
export async function setupSubplebbitListeners(plebbit, addresses, db) {
  // First add all addresses to the queue
  queueMultipleSubplebbits(db, addresses);
  
  // Then process the queue
  return await processSubplebbitQueue(plebbit, db, addresses.length);
}

/**
 * Starts a regular queue processor that checks the queue every X minutes
 */
export function startQueueProcessor(plebbit, db, intervalMinutes = 15) {
  console.log(`Starting queue processor with interval of ${intervalMinutes} minutes`);
  
  // Process the queue immediately once
  processSubplebbitQueue(plebbit, db);
  
  // Then check the queue regularly
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    processSubplebbitQueue(plebbit, db);
  }, intervalMs);
  
  return intervalId;
}

/**
 * Updates the queue with new addresses from GitHub
 */
export async function refreshSubplebbitQueue(db) {
  const addresses = await getSubplebbitAddresses();
  if (addresses.length > 0) {
    console.log(`Refreshing queue with ${addresses.length} subplebbit addresses...`);
    queueMultipleSubplebbits(db, addresses);
  }
  return addresses.length;
}