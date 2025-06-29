import { indexPosts } from './indexer.js';
import { withTimeout } from './utils.js';
import { queueMultipleSubplebbits, getNextSubplebbitsFromQueue, updateSubplebbitStatus, isSubplebbitBlacklisted, isAuthorBlacklisted, cleanupNullAddresses } from './db.js';

/**
 * Fetches subplebbit addresses from GitHub and adds them to known_subplebbits
 */
export async function getNewSubplebbitAddressesFromGithub(db) {
  try {
    console.log('[GitHub] Fetching subplebbit addresses from GitHub...');
    const response = await fetch('https://raw.githubusercontent.com/plebbit/temporary-default-subplebbits/master/multisub.json');
    const subplebbitList = await response.json();
    const subplebbits = subplebbitList.subplebbits.map(item => ({
      address: item.address,
      tags: item.tags ? JSON.stringify(item.tags) : null
    }));
    console.log(`[GitHub] Retrieved ${subplebbits.length} subplebbits from GitHub`);
    
    // Add new addresses to known_subplebbits
    const newAddresses = [];
    for (const subplebbit of subplebbits) {
      // Check if we already know about this subplebbit
      const knownStmt = db.prepare('SELECT address,tags FROM known_subplebbits WHERE address = ?');
      const known = knownStmt.get(subplebbit.address);
      console.log(`[GitHub] Known subplebbit: ${known.address} with tags: ${known.tags}`);
      
      if (!known) {
        console.log(`[GitHub] Found new subplebbit: ${subplebbit.address}`);
        // Add to known subplebbits
        const insertStmt = db.prepare(`
          INSERT INTO known_subplebbits (address, source, discovered_at, last_seen_at, tags)
          VALUES (?, 'github', ?, ?, ?)
        `);
        const now = Date.now();
        insertStmt.run(subplebbit.address, now, now, subplebbit.tags);
        newAddresses.push(subplebbit.address);
      } else {
        // Update last_seen_at and tags
        const updateStmt = db.prepare(`
          UPDATE known_subplebbits 
          SET last_seen_at = ?,
              tags = ?
          WHERE address = ?
        `);
        updateStmt.run(Date.now(), subplebbit.tags, subplebbit.address);
      }
    }
    
    console.log(`[GitHub] Added ${newAddresses.length} new subplebbits to known_subplebbits`);
    return newAddresses;
  } catch (error) {
    console.error('[GitHub] Error fetching subplebbit addresses:', error);
    return [];
  }
}

/**
 * Initializes the queue with addresses from known_subplebbits
 */
export async function initializeSubplebbitQueue(db) {
  // First clean up any null addresses
  cleanupNullAddresses(db);
  
  // Reset any stuck processing items back to queued
  console.log('[Queue] Resetting any stuck processing items back to queued');
  const resetStmt = db.prepare(`
    UPDATE subplebbit_queue 
    SET status = 'queued', 
        updated_at = ? 
  `);
  resetStmt.run(Date.now());

  // Get all addresses from known_subplebbits that aren't in the queue
  console.log('[Queue] Getting all addresses from known_subplebbits that aren\'t in the queue');
  const addressesStmt = db.prepare(`
    SELECT k.address 
    FROM known_subplebbits k
    LEFT JOIN subplebbit_queue q ON k.address = q.address
    WHERE q.address IS NULL
  `);
  const addresses = addressesStmt.all().map(row => row.address);
  console.log(`[Queue] Found ${addresses.length} addresses from known_subplebbits that aren't in the queue`);

  if (addresses.length > 0) {
    console.log(`Queueing ${addresses.length} subplebbit addresses from known_subplebbits...`);
    queueMultipleSubplebbits(db, addresses);
  }
  return addresses.length;
}

/**
 * Processes the next subplebbits from the queue
 */
export async function processSubplebbitQueue(plebbit, db, batchSize = 10) {
  // Add a lock check to prevent simultaneous processing
  const isProcessing = db.prepare('SELECT COUNT(*) as count FROM subplebbit_queue WHERE status = ?').get('processing').count > 0;
  if (isProcessing) {
    console.log('[Queue Processor] Queue is already being processed, skipping...');
    return [];
  }

  const queueItems = getNextSubplebbitsFromQueue(db, batchSize);
  console.log(`[Queue Processor] Starting to process ${queueItems.length} subplebbits from queue...`);
  console.log(`[Queue Processor] Queue items:`, queueItems.map(item => ({ address: item.address, status: item.status })));
  
  const subs = [];
  for (const item of queueItems) {
    const { address } = item;
    try {
      // Mark as "in progress"
      updateSubplebbitStatus(db, address, 'processing');
      
      console.log(`[Queue Processor] Getting subplebbit instance for ${address}`);
      
      const sub = await withTimeout(
        plebbit.getSubplebbit(address),
        10000,
        `Timeout getting subplebbit at ${address}`
      );
      
      console.log(`[Queue Processor] Updating subplebbit ${address}`);
      
      await withTimeout(
        sub.update(),
        10000,
        `Timeout updating subplebbit at ${address}`
      );
      
      console.log(`[Queue Processor] Starting indexing for ${address}`);
      
      console.log(`Indexing subplebbit at ${address}`);
      await indexSubplebbit(sub, db);
      
      // Mark as successful
      updateSubplebbitStatus(db, address, 'success');
      
      // Set up listener for updates
      setupSubplebbitListener(sub, db, address);
      
      console.log(`[Queue Processor] Successfully indexed ${address}`);
      
      subs.push(sub);
    } catch (err) {
      console.error(`Error processing subplebbit at address ${address}:`, err);
      // Mark as failed with error message
      const errorMessage = err.details ? `${err.message} (Details: ${JSON.stringify(err.details)})` : err.message || 'Unknown error';
      updateSubplebbitStatus(db, address, 'failed', errorMessage);
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
    const errorMessage = err.details ? `${err.message} (Details: ${JSON.stringify(err.details)})` : err.message || 'Error event';
    updateSubplebbitStatus(db, address, 'failed', errorMessage);
  });

  // Listen for updates
  sub.on('update', async () => {
    console.log(`Subplebbit ${address} updated, re-indexing first 'new' page...`);
    try {
      await indexSubplebbit(sub, db, true); // Pass true to indicate this is an update event
      updateSubplebbitStatus(db, address, 'success');
    } catch (err) {
      console.error(`Error updating/indexing subplebbit at ${address} (on update event):`, err);
      const errorMessage = err.details ? `${err.message} (Details: ${JSON.stringify(err.details)})` : err.message || 'Update event error';
      updateSubplebbitStatus(db, address, 'failed', errorMessage);
    }
  });
}

export async function indexSubplebbit(sub, db, isUpdateEvent = false) {
  console.log(`[Indexer] Starting indexing for subplebbit ${sub.address} (isUpdateEvent: ${isUpdateEvent})`);
  console.log(`[Indexer] Subplebbit details:
    Title: ${sub.title || 'N/A'}
    Description: ${sub.description || 'N/A'}
    Tags: ${sub.tags?.join(', ') || 'N/A'}
  `);
  
  // Check if subplebbit is blacklisted
  if (isSubplebbitBlacklisted(db, sub.address)) {
    console.log(`Subplebbit ${sub.address} is blacklisted, skipping indexing`);
    return;
  }
  
  // Step 1: Get all top-level posts
  let allPosts = [];
  
  if (Object.keys(sub.posts.pageCids).length !== 0) {
    console.log(`[Indexer] Found pageCids for ${sub.address}:`, Object.keys(sub.posts.pageCids));
    let postsPage = await sub.posts.getPage(sub.posts.pageCids.new);
    console.log(`[Indexer] Processing page ${postsPage.nextCid} for ${sub.address}`);
    console.log(`[Indexer] Found ${postsPage.comments.length} comments on this page`);
    
    // For update events (when a subplebbit is updated), we only index the first new post
    // This is a performance optimization since we only need the newest content
    // For regular indexing, we fetch and index all posts from all pages
    allPosts = isUpdateEvent ? [postsPage.comments[0]] : [...postsPage.comments];
    console.log("After initial assignment - allPosts length:", allPosts.length);
    console.log("isUpdateEvent:", isUpdateEvent, "allPosts:", allPosts.map(p => p.cid));
    
    // Only process additional pages if it's not an update event
    // During regular indexing, we recursively fetch all pages using nextCid
    // to ensure we have the complete post history
    if (!isUpdateEvent) {
      console.log("Processing additional pages (non-update event)");
      while (postsPage.nextCid) {
        try {
          console.log("Fetching next page with CID:", postsPage.nextCid);
          postsPage = await sub.posts.getPage(postsPage.nextCid);
          console.log("Next page comments length:", postsPage.comments.length);
          allPosts = allPosts.concat(postsPage.comments);
          console.log("Updated allPosts length:", allPosts.length);
        } catch (err) {
          console.error(`Error loading next page (${postsPage.nextCid}):`, err);
          break;
        }
      }
    } else {
      console.log("Skipping additional pages (update event)");
    }
  } else {
    console.log("No pageCids found, using direct pages access");
    console.log("isUpdateEvent:", isUpdateEvent);
    allPosts = isUpdateEvent ? [] : Object.values(sub.posts.pages)[0].comments;
    console.log("Final allPosts length:", allPosts.length);
  }

  // Filter out posts from blacklisted authors
  const originalPostCount = allPosts.length;
  allPosts = allPosts.filter(post => {
    if (post.author?.address && isAuthorBlacklisted(db, post.author.address)) {
      console.log(`Skipping post from blacklisted author: ${post.author.address}`);
      return false;
    }
    return true;
  });
  
  if (originalPostCount !== allPosts.length) {
    console.log(`Filtered ${originalPostCount - allPosts.length} posts from blacklisted authors`);
  }
   
  console.log(`[Indexer] Now indexing ${allPosts.length} posts for ${sub.address}...`);
  await indexPosts(db, allPosts);
  
  // If this is an update event, run content moderation on the new posts
  if (process.env.ENABLE_CONTENT_MODERATION === 'true' && isUpdateEvent && allPosts.length > 0) {
    console.log(`Running content moderation on ${allPosts.length} new posts from update event...`);
    for (const post of allPosts) {
      // Skip posts with no content
      if (!post.content && !post.title) {
        continue;
      }
      
      // Analyze the content (combine title and content if both exist)
      const contentToAnalyze = post.title 
        ? `${post.title}\n\n${post.content || ''}`
        : post.content;
      
      const result = await analyzeContent(contentToAnalyze);
      console.log(`Post ${post.cid} analyzed: ${result}`);
    
      // Flag posts with problematic content
      if (result !== 'SAFE' && result !== '**SAFE**' && result !== 'ERROR' && result !== 'UNKNOWN') {
        await flagPost(db, post.cid, result);
      }
    }
  }
  
  // Step 2: Process and index all replies in a flattened structure
  console.log(`[Indexer] Processing replies for ${allPosts.length} posts in ${sub.address}...`);
  for (const post of allPosts) {
    if (post.replies) {
      const allReplies = getAllReplies(post, post.cid);
      
      // Filter out replies from blacklisted authors
      const filteredReplies = allReplies.filter(reply => {
        if (reply.author?.address && isAuthorBlacklisted(db, reply.author.address)) {
          console.log(`Skipping reply from blacklisted author: ${reply.author.address}`);
          return false;
        }
        return true;
      });
      
      if (filteredReplies.length > 0) {
        console.log(`Indexing ${filteredReplies.length} total replies for post ${post.cid} (filtered ${allReplies.length - filteredReplies.length} from blacklisted authors)`);
        await indexPosts(db, filteredReplies);
      }
    }
  }
  
  console.log(`[Indexer] Successfully indexed ${allPosts.length} posts for ${sub.address}`);

  // Store the subplebbit title in known_subplebbits
  const updateTitleStmt = db.prepare(`
    UPDATE known_subplebbits 
    SET title = ?, last_seen_at = ? 
    WHERE address = ?
  `);
  updateTitleStmt.run(sub.title || null, Date.now(), sub.address);
}

// New helper function that uses the flattening approach
function getAllReplies(comment, postCid) {
  const allReplies = [];
  
  if (!comment.replies) return allReplies;
  
  // Case 1: Handle replies.pages structure
  if (comment.replies.pages && Object.keys(comment.replies.pages).length > 0) {
    for (const sortType in comment.replies.pages) {
      const page = comment.replies.pages[sortType];
      if (page?.comments?.length) {
        // Process current page comments
        const repliesWithReferences = page.comments.map(reply => ({
          ...reply,
          parentCid: comment.cid,
          postCid: postCid
        }));
        
        // Add these replies to our collection
        allReplies.push(...repliesWithReferences);
        
        // Recursively get replies to these replies
        for (const reply of repliesWithReferences) {
          const nestedReplies = getAllReplies(reply, postCid);
          allReplies.push(...nestedReplies);
        }
      }
    }
  }
  // Case 2: Direct comments array
  else if (comment.replies.comments) {
    const repliesWithReferences = comment.replies.comments.map(reply => ({
      ...reply,
      parentCid: comment.cid,
      postCid: postCid
    }));
    
    allReplies.push(...repliesWithReferences);
    
    // Recursively process these comments
    for (const reply of repliesWithReferences) {
      if (reply.replies) {
        const nestedReplies = getAllReplies(reply, postCid);
        allReplies.push(...nestedReplies);
      }
    }
  }
  // Case 3: Direct object with sortTypes
  else {
    for (const sortType in comment.replies) {
      const page = comment.replies[sortType];
      if (page?.comments?.length) {
        const repliesWithReferences = page.comments.map(reply => ({
          ...reply,
          parentCid: comment.cid,
          postCid: postCid
        }));
        
        allReplies.push(...repliesWithReferences);
        
        for (const reply of repliesWithReferences) {
          if (reply.replies) {
            const nestedReplies = getAllReplies(reply, postCid);
            allReplies.push(...nestedReplies);
          }
        }
      }
    }
  }
  
  // Remove duplicates by cid
  const uniqueReplies = {};
  for (const reply of allReplies) {
    uniqueReplies[reply.cid] = reply;
  }
  
  return Object.values(uniqueReplies);
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
  
  // Process the queue immediately once with a smaller batch size
  processSubplebbitQueue(plebbit, db, 5);
  
  // Then check the queue regularly with a smaller batch size
  const intervalMs = intervalMinutes * 60 * 1000;
  const intervalId = setInterval(() => {
    processSubplebbitQueue(plebbit, db, 5);
  }, intervalMs);
  
  return intervalId;
}

/**
 * 1. Updates known_subplebbits with new addresses from GitHub
 * 2. Initializes the queue with addresses from known_subplebbits
 */
export async function refreshSubplebbitQueue(db) {
  console.log('[Refresh] Starting queue refresh process');
  console.log('[Refresh] Fetching new addresses from GitHub...');
  const newAddresses = await getNewSubplebbitAddressesFromGithub(db);
  console.log(`[Refresh] Found ${newAddresses.length} new addresses from GitHub`);
  initializeSubplebbitQueue(db);

  // if (newAddresses.length > 0) {
  //   console.log('[Refresh] New addresses found:', newAddresses);
  //   console.log('[Refresh] Adding new addresses to queue...');
  //   queueMultipleSubplebbits(db, newAddresses);
  //   console.log('[Refresh] Successfully added new addresses to queue');
  // } else {
  //   console.log('[Refresh] No new addresses found to add to queue');
  // }
  return newAddresses.length;
}