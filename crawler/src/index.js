import { getDb } from './db.js';
import { getPlebbitClient } from './plebbitClient.js';
import { getSubplebbitAddresses, setupSubplebbitListeners } from './subplebbit.js';
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
 * - [ ] add a way to find new subplebbit address while the crawler is running (e.g. by daily searching github for new subplebbit repos, getting an event from the DAO smart contract, etc.)
 * - [ ] if a subplebbit is erroring out, it should be written into another table so we can pick it up later
 * 
 * TODO: (nice to have)
 * - [ ] add prometheus metrics for indexing speed, error rate, amount of posts indexed, amount of subplebbit listeners, etc.
 * - [ ] if a subplebbit is updated, it could be published to a pubsub topic so that other services can pick it up - question: is an ipns publish sufficient or should we use a pubsub topic?
 */
async function main() {
  startServer(); // Start the REST server

  const db = await getDb();
  const plebbit = await getPlebbitClient();
  const addresses = await getSubplebbitAddresses();
  const subs = await setupSubplebbitListeners(plebbit, addresses, db);
  console.log("listening to updates for " + subs.length + " subplebbits");
  process.stdin.resume();
}

main();