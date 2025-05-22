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
      await indexSubplebbit(sub, db);
      updateSubplebbitStatus(db, address, 'success');
    } catch (err) {
      console.error(`Error updating/indexing subplebbit at ${address} (on update event):`, err);
      updateSubplebbitStatus(db, address, 'failed', err.message || 'Update event error');
    }
  });
}

export async function indexSubplebbit(sub, db) {
  console.log("indexSubplebbit", Object.keys(sub.posts.pageCids).length !== 0);
  
  // Step 1: Get all top-level posts
  let allPosts = [];
  
  if (Object.keys(sub.posts.pageCids).length !== 0) {
    console.log("sub.posts.pageCids", sub.posts.pageCids);
    let postsPage = await sub.posts.getPage(sub.posts.pageCids.new);
    allPosts = [...postsPage.comments];
    
    while (postsPage.nextCid) {
      try {
        postsPage = await sub.posts.getPage(postsPage.nextCid);
        allPosts = allPosts.concat(postsPage.comments);
      } catch (err) {
        console.error(`Error loading next page (${postsPage.nextCid}):`, err);
        break;
      }
    }
  } else {
    allPosts = Object.values(sub.posts.pages)[0].comments;
  }

  // //only for testing purposes - remove this
  // const targetAuthorAddress = "12D3KooWQ3aXtQsfk6L8CEjboLuCF6jkY8oizL31qfhy9tSJrLZ6";
  // if (targetAuthorAddress) {
  //   allPosts = allPosts.filter(post => post.author?.address === targetAuthorAddress);
  //   console.log(`Filtered to ${allPosts.length} posts by author ${targetAuthorAddress}`);
  // }
   
  console.log(`Now indexing ${allPosts.length} posts...`);
  await indexPosts(db, allPosts);
  
  // Step 2: Process and index all replies in a flattened structure
  console.log(`Processing replies for ${allPosts.length} posts...`);
  for (const post of allPosts) {
    if (post.replies) {
      const allReplies = getAllReplies(post, post.cid)   
      if (allReplies.length > 0) {
        console.log(`Indexing ${allReplies.length} total replies for post ${post.cid}`);
        await indexPosts(db, allReplies);
      }
    }
  }
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