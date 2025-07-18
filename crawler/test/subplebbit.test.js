import { strict as assert } from 'assert';
import { getNewSubplebbitAddressesFromGithub, indexSubplebbit } from '../src/subplebbit.js';
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
      // await db.close();
    }
  }, 20000);

   it('should check if db is open', async function() {
    assert(db, 'DB should be open');
   }, 20000);



  it('should get subplebbit addresses', async function() {
    console.log("getting subplebbit addresses");
    const addresses = await getNewSubplebbitAddressesFromGithub(db);
    assert(Array.isArray(addresses), 'Should return an array of addresses');
    assert(addresses.length > 0, 'Should return at least one address');
  });

  it('should index the first subplebbit and be queryable via API', async function() {
    // await db.runAsync('DELETE FROM posts');
    const addresses = await getNewSubplebbitAddressesFromGithub(db);
    const firstAddress = addresses[0];
    const sub = await plebbit.getSubplebbit(firstAddress);
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts');
    assert.equal(response.status, 200); 
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    // console.log("response.body",response.body);
    // // assert(response.body.length > 0, 'Should return at least one post');
    // assert('id' in response.body[0], 'Post should have an id');
  }, 200000);

  it('should check if posts are available', async function() { //when we have fresh db this will fail
    console.log("checking if posts are available");
    const response = await request.get('/api/posts');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert(response.body.posts.length > 0, 'Should return at least one post');
    
    // Check required fields for each post
    response.body.posts.forEach((post, index) => {
      console.log("post", post);
      // assert(post.title !== undefined && post.title !== null && post.title !== '', `Post at index ${index} should have a title`); //not all posts have titles
      assert(post.timestamp !== undefined && post.timestamp !== null, `Post at index ${index} should have a timestamp`);
      // assert(post.content !== undefined && post.content !== null, `Post at index ${index} should have content`); //not all posts have content
      assert(post.subplebbitAddress !== undefined && post.subplebbitAddress !== null && post.subplebbitAddress !== '', `Post at index ${index} should have a subplebbitAddress`);
      assert(post.authorAddress !== undefined && post.authorAddress !== null && post.authorAddress !== '', `Post at index ${index} should have an authorAddress`);
    });
    // await db.runAsync('DELETE FROM posts');
   }, 20000);

  it('should get a specific post by ID', async function() {
    // First, get a list of posts to find a valid ID
    const postsResponse = await request.get('/api/posts?limit=10');
    assert.equal(postsResponse.status, 200);
    assert(postsResponse.body.posts.length > 0, 'Should have at least one post to test with');
    
    // Use the ID of the first post
    const testPostId = postsResponse.body.posts[0].id;
    
    // Test the specific post endpoint
    const response = await request.get(`/api/posts/${testPostId}`);
    assert.equal(response.status, 200, 'Should successfully retrieve the post');
    assert(response.body.post, 'Response should contain a post object');
    assert.equal(response.body.post.id, testPostId, 'Retrieved post should have the correct ID');
    
    // Verify the post has all required fields
    const post = response.body.post;
    assert(post.title !== undefined, 'Post should have a title');
    assert(post.timestamp !== undefined, 'Post should have a timestamp');
    assert(post.content !== undefined, 'Post should have content');
    assert(post.subplebbitAddress !== undefined, 'Post should have a subplebbitAddress');
    assert(post.authorAddress !== undefined, 'Post should have an authorAddress');
    
    // Verify parent information fields are present (they should exist but may be null for top-level posts)
    assert('postTitle' in post, 'Post should have postTitle field');
    assert('postAuthorDisplayName' in post, 'Post should have postAuthorDisplayName field');
    assert('postAuthorAddress' in post, 'Post should have postAuthorAddress field');
    
    // Update field checks
    assert('postTitle' in post, 'Post should have postTitle field');
    assert('postAuthorDisplayName' in post, 'Post should have postAuthorDisplayName field');
    assert('postAuthorAddress' in post, 'Post should have postAuthorAddress field');

  }, 20000);

  it('should return 404 for non-existent post ID', async function() {
    // Test with a non-existent ID
    const nonExistentId = 'QmNonExistentPostId';
    
    const response = await request.get(`/api/posts/${nonExistentId}`);
    assert.equal(response.status, 404, 'Should return 404 for non-existent post');
    assert(response.body.error, 'Response should contain an error message');
  }, 20000);

  it('should search posts for the word "piracy"', async function() {
    const sub = await plebbit.getSubplebbit("plebpiracy.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts/search?q=piracy');
    assert.equal(response.status, 200, 'Search request should succeed');
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    // Check that all returned posts contain the word "piracy" in some field
    response.body.posts.forEach(post => {
      const hasPiracy = 
        (post.title && post.title.toLowerCase().includes('piracy')) ||
        (post.content && post.content.toLowerCase().includes('piracy')) ||
        (post.authorDisplayName && post.authorDisplayName.toLowerCase().includes('piracy')) ||
        (post.subplebbitAddress && post.subplebbitAddress.toLowerCase().includes('piracy'));
      assert(hasPiracy, 'Each returned post should contain the word "piracy" in some field');
    });
  }, 20000);

  it('should index pleblore.eth and check for a specific comment', async function() {
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
    console.log("postsResponse", postsResponse);
    assert.equal(postsResponse.status, 200);
    assert(Array.isArray(postsResponse.body.posts), 'Should return an array of posts');
    assert(postsResponse.body.posts.length > 0, 'Should return at least one post');
    
    // Find posts from pleblore.eth
    const pleblorePostsResponse = await request.get('/api/posts/search?q=pleblore.eth');
    assert.equal(pleblorePostsResponse.status, 200);
    assert(Array.isArray(pleblorePostsResponse.body.posts), 'Should return an array of posts');
    
    // Check if the specific comment exists
    const targetCid = "Qmc6i3fZ9BDTt3xyjZywPaLYkG8BzuRzp9QhVmBcSQpgWp";
    console.log("pleblorePostsResponse.body.posts", pleblorePostsResponse.body.posts);
    const specificPost = pleblorePostsResponse.body.posts.find(post => post.id === targetCid);
    
    assert(specificPost, `Comment with CID ${targetCid} should exist in pleblore.eth`);
    console.log("Found the specific comment:", specificPost);
  }, 200000);

  it('should index redditdeath.sol and verify posts are available', async function() {
    // Target the specific subplebbit "redditdeath.sol"
    const address = "redditdeath.sol";
    console.log("Testing specific subplebbit address:", address);
    
    // Get the subplebbit object
    const sub = await plebbit.getSubplebbit(address);
    await sub.update();
    
    // Index the subplebbit
    await indexSubplebbit(sub, db);

    // Verify the subplebbit was indexed by checking API
    const postsResponse = await request.get('/api/posts/search?q='+address);
    assert.equal(postsResponse.status, 200);
    assert(Array.isArray(postsResponse.body.posts), 'Should return an array of posts');
    console.log("postsResponse.body.posts", postsResponse.body.posts);
    // Find posts from redditdeath.sol
    const redditdeathPosts = postsResponse.body.posts.filter(post => 
      post.subplebbitAddress === address
    );
    
    assert(redditdeathPosts.length > 0, `Should have posts from ${address}`);
    console.log(`Found ${redditdeathPosts.length} posts from ${address}`);
    
    // Log first post details for verification
    if (redditdeathPosts.length > 0) {
      console.log("Sample post:", redditdeathPosts[0]);
    }
  }, 200000);

  it('should search posts for the author address "12D3KooWA7gYpM3W5wNL7qAXsdrT2zjbF7vYwnWZ2jKUfrfSFRgE"', async function() {
    const sub = await plebbit.getSubplebbit("pleblore.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    // Search for the specific author address
    const authorAddress = "12D3KooWA7gYpM3W5wNL7qAXsdrT2zjbF7vYwnWZ2jKUfrfSFRgE";
    const response = await request.get(`/api/posts/search?q=${authorAddress}`);
    
    assert.equal(response.status, 200, 'Search request should succeed');
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    
    // Check that at least one post has this author address
    const hasAuthorPosts = response.body.posts.some(post => 
      post.authorAddress === authorAddress
    );
    
    assert(hasAuthorPosts, `Should find at least one post from author ${authorAddress}`);
    
    // Log the found posts for verification
    const authorPosts = response.body.posts.filter(post => post.authorAddress === authorAddress);
    console.log(`Found ${authorPosts.length} posts from author ${authorAddress}`);
    if (authorPosts.length > 0) {
      console.log("First author post:", authorPosts[0]);
    }
  }, 20000);

}); 