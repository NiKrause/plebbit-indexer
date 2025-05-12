import { indexPosts } from './indexer.js';
import { withTimeout } from './utils.js';

export async function getSubplebbitAddresses() {
  const response = await fetch('https://raw.githubusercontent.com/plebbit/temporary-default-subplebbits/master/multisub.json');
  const subplebbitList = await response.json();
  return subplebbitList.subplebbits.map(item => item.address);
}

export async function indexSubplebbit(sub, db) {
  if(sub.posts.pageCids.new) {
    let postsPage = await sub.posts.getPage(sub.posts.pageCids.new);
    let allPosts = [...postsPage.comments];
    console.log("allPosts", allPosts.length);
    while (postsPage.nextCid) {
    try {
      postsPage = await sub.posts.getPage(postsPage.nextCid);
      allPosts = allPosts.concat(postsPage.comments);
      console.log("allPosts", allPosts.length);
    } catch (err) {
      console.error(`Error loading next page (${postsPage.nextCid}):`, err);
      break;
      }
    }
    await indexPosts(db, allPosts);
  }
}

export async function setupSubplebbitListeners(plebbit, addresses, db) {
  const subs = [];
  for (const address of addresses) {
    try {
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
      console.log("indexing subplebbit at " + address);
      await indexSubplebbit(sub, db);

      // Listen for errors on this subplebbit
      sub.on('error', (err) => {
        console.error(`Subplebbit error event for ${address}:`, err);
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
        } catch (err) {
          console.error(`Error updating/indexing subplebbit at ${address} (on update event):`, err);
        }
      });

      subs.push(sub);
    } catch (err) {
      console.error(`Error processing subplebbit at address ${address}:`, err);
    }
  }
  return subs;
}
