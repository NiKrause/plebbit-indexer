import { strict as assert } from 'assert';
import { getSubplebbitAddresses, indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
// import Plebbit from '@plebbit/plebbit-js';
import supertest from 'supertest';

describe('Subplebbit functionality', function () {

  let plebbit;
  let db;
  let request;
  let server;

  beforeAll(async function() {
    plebbit = await getPlebbitClient()
    db = await getDb();
    request = supertest('http://localhost:3001');
    server = await startServer(db);
  });

  afterAll(async function() {
    
    if (plebbit) {
      await plebbit.destroy();
    }
    if (db) {
      await db.close();
    }
  }, 20000);

   it('should check if db is open', async function() {
    assert(db, 'DB should be open');
   }, 20000);



  it('should get subplebbit addresses', async function() {
    console.log("getting subplebbit addresses");
    const addresses = await getSubplebbitAddresses();
    assert(Array.isArray(addresses), 'Should return an array of addresses');
    assert(addresses.length > 0, 'Should return at least one address');
  });

  it('should index the first subplebbit and be queryable via API', async function() {
    // await db.runAsync('DELETE FROM posts');
    const addresses = await getSubplebbitAddresses();
    const firstAddress = addresses[0];
    console.log("firstAddress",firstAddress);
    const sub = await plebbit.getSubplebbit(firstAddress);
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts');
    assert.equal(response.status, 200); 
    assert(Array.isArray(response.body), 'Should return an array of posts');
    // console.log("response.body",response.body);
    // // assert(response.body.length > 0, 'Should return at least one post');
    // assert('id' in response.body[0], 'Post should have an id');
  }, 200000);

  it('should check if posts are available', async function() { //when we have fresh db this will fail
    console.log("checking if posts are available");
    const response = await request.get('/api/posts');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body), 'Should return an array of posts');
    assert(response.body.length > 0, 'Should return at least one post');
    
    // Check required fields for each post
    response.body.forEach((post, index) => {
      assert(post.title, `Post at index ${index} should have a title`);
      assert(post.timestamp, `Post at index ${index} should have a timestamp`);
      assert(post.content, `Post at index ${index} should have content`);
      assert(post.subplebbitAddress, `Post at index ${index} should have a subplebbitAddress`);
      assert(post.authorAddress, `Post at index ${index} should have an authorAddress`);
      assert(post.authorDisplayName, `Post at index ${index} should have an authorDisplayName`);
    });
    // await db.runAsync('DELETE FROM posts');
   }, 20000);


  it.only('should search posts for the word "piracy"', async function() {
    const sub = await plebbit.getSubplebbit("plebpiracy.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts/search?q=piracy');
    assert.equal(response.status, 200, 'Search request should succeed');
    assert(Array.isArray(response.body), 'Should return an array of posts');
    console.log("response.body", response.body);
    // Check that all returned posts contain the word "piracy" in some field
    response.body.forEach(post => {
      const hasPiracy = 
        (post.title && post.title.toLowerCase().includes('piracy')) ||
        (post.content && post.content.toLowerCase().includes('piracy')) ||
        (post.authorDisplayName && post.authorDisplayName.toLowerCase().includes('piracy')) ||
        (post.subplebbitAddress && post.subplebbitAddress.toLowerCase().includes('piracy'));
      assert(hasPiracy, 'Each returned post should contain the word "piracy" in some field');
    });
  }, 20000);

  it.only('should index pleblore.eth and check for a specific comment', async function() {
    // Target the specific subplebbit "pleblore.eth"
    const address = "pleblore.eth";
    console.log("Testing specific subplebbit address:", address);
    
    // Get the subplebbit object
    const sub = await plebbit.getSubplebbit(address);
    await sub.update();
    
    // Index the subplebbit
    await indexSubplebbit(sub, db);

    // Verify the subplebbit was indexed by checking API
    const postsResponse = await request.get('/api/posts');
    assert.equal(postsResponse.status, 200);
    assert(Array.isArray(postsResponse.body), 'Should return an array of posts');
    assert(postsResponse.body.length > 0, 'Should return at least one post');
    
    // Find posts from pleblore.eth
    const pleblorePostsResponse = await request.get('/api/posts/search?q=pleblore.eth');
    assert.equal(pleblorePostsResponse.status, 200);
    assert(Array.isArray(pleblorePostsResponse.body), 'Should return an array of posts');
    
    // Check if the specific comment exists
    const targetCid = "Qmc6i3fZ9BDTt3xyjZywPaLYkG8BzuRzp9QhVmBcSQpgWp";
    const specificPost = pleblorePostsResponse.body.find(post => post.id === targetCid);
    
    assert(specificPost, `Comment with CID ${targetCid} should exist in pleblore.eth`);
    console.log("Found the specific comment:", specificPost);
  }, 200000);

  it.only('should index redditdeath.sol and verify posts are available', async function() {
    // Target the specific subplebbit "redditdeath.sol"
    const address = "redditdeath.sol";
    console.log("Testing specific subplebbit address:", address);
    
    // Get the subplebbit object
    const sub = await plebbit.getSubplebbit(address);
    await sub.update();
    
    // Index the subplebbit
    await indexSubplebbit(sub, db);

    // Verify the subplebbit was indexed by checking API
    const postsResponse = await request.get('/api/posts');
    assert.equal(postsResponse.status, 200);
    assert(Array.isArray(postsResponse.body), 'Should return an array of posts');
    
    // Find posts from redditdeath.sol
    const redditdeathPosts = postsResponse.body.filter(post => 
      post.subplebbitAddress === address
    );
    
    assert(redditdeathPosts.length > 0, `Should have posts from ${address}`);
    console.log(`Found ${redditdeathPosts.length} posts from ${address}`);
    
    // Log first post details for verification
    if (redditdeathPosts.length > 0) {
      console.log("Sample post:", redditdeathPosts[0]);
    }
  }, 200000);

}, 20000); 