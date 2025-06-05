import { strict as assert } from 'assert';
import { indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
import supertest from 'supertest';

describe('Include replies functionality', function () {
  let plebbit;
  let db;
  let request;
  let server;

  beforeAll(async function() {
    plebbit = await getPlebbitClient();
    db = await getDb();
    request = supertest('http://localhost:3001');
    server = await startServer(db);
  });

  afterAll(async function() {
    if (plebbit) {
      await plebbit.destroy();
    }
  }, 20000);

  it('should include replies by default when include-replies parameter is not specified', async function() {
    const response = await request.get('/api/posts');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.includeReplies, true, 'Should include replies by default');
    
    // Check if there are both posts and replies in the results
    const hasTopLevelPosts = response.body.posts.some(post => !post.parentCid);
    const hasReplies = response.body.posts.some(post => post.parentCid);
    
    console.log(`Found ${response.body.posts.length} total items: ${response.body.posts.filter(p => !p.parentCid).length} top-level posts, ${response.body.posts.filter(p => p.parentCid).length} replies`);
    
    if (response.body.posts.length > 0) {
      assert(hasTopLevelPosts, 'Should have at least some top-level posts');
      // Note: hasReplies might be false if no replies exist in test data, so we don't assert this
    }
  }, 20000);

  it('should include replies when include-replies=true is specified', async function() {
    const response = await request.get('/api/posts?include-replies=true');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.includeReplies, true, 'Should include replies when explicitly set to true');
    
    // Check if there are both posts and replies in the results
    const hasTopLevelPosts = response.body.posts.some(post => !post.parentCid);
    
    console.log(`Found ${response.body.posts.length} total items when include-replies=true`);
    
    if (response.body.posts.length > 0) {
      assert(hasTopLevelPosts, 'Should have at least some top-level posts');
    }
  }, 20000);

  it('should exclude replies when include-replies=false is specified', async function() {
    const response = await request.get('/api/posts?include-replies=false');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.includeReplies, false, 'Should not include replies when set to false');
    
    // All returned posts should be top-level posts (no parentCid)
    response.body.posts.forEach((post, index) => {
      assert(!post.parentCid, `Post at index ${index} should not have a parentCid (should be top-level only)`);
    });
    
    console.log(`Found ${response.body.posts.length} top-level posts when include-replies=false`);
  }, 20000);

  it('should work with search endpoint - include replies by default', async function() {
    // Index a subplebbit to ensure we have data
    const sub = await plebbit.getSubplebbit("plebtoken.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts/search?q=test');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.includeReplies, true, 'Should include replies by default in search');
    
    console.log(`Search found ${response.body.posts.length} results including replies`);
  }, 200000);

  it('should work with search endpoint - exclude replies when specified', async function() {
    const response = await request.get('/api/posts/search?q=test&include-replies=false');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.includeReplies, false, 'Should not include replies when set to false in search');
    
    // All returned posts should be top-level posts (no parentCid)
    response.body.posts.forEach((post, index) => {
      assert(!post.parentCid, `Search result at index ${index} should not have a parentCid when include-replies=false`);
    });
    
    console.log(`Search with include-replies=false found ${response.body.posts.length} top-level posts only`);
  }, 20000);

  it('should work with other parameters (sort, time filter)', async function() {
    const response = await request.get('/api/posts?sort=top&t=day&include-replies=false');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');
    assert.equal(response.body.filters.sort, 'top', 'Should respect sort parameter');
    assert.equal(response.body.filters.timeFilter, 'day', 'Should respect time filter parameter');
    assert.equal(response.body.filters.includeReplies, false, 'Should respect include-replies parameter');
    
    // All returned posts should be top-level posts (no parentCid)
    response.body.posts.forEach((post, index) => {
      assert(!post.parentCid, `Post at index ${index} should not have a parentCid when include-replies=false`);
    });
    
    console.log(`Found ${response.body.posts.length} posts with sort=top, t=day, include-replies=false`);
  }, 20000);

  it('should handle pagination correctly with include-replies parameter', async function() {
    // Test with include-replies=true
    const responseWithReplies = await request.get('/api/posts?include-replies=true&limit=5&page=1');
    assert.equal(responseWithReplies.status, 200);
    assert.equal(responseWithReplies.body.filters.includeReplies, true);
    
    // Test with include-replies=false
    const responseWithoutReplies = await request.get('/api/posts?include-replies=false&limit=5&page=1');
    assert.equal(responseWithoutReplies.status, 200);
    assert.equal(responseWithoutReplies.body.filters.includeReplies, false);
    
    // The total count should be different
    const totalWithReplies = responseWithReplies.body.pagination.total;
    const totalWithoutReplies = responseWithoutReplies.body.pagination.total;
    
    console.log(`Total with replies: ${totalWithReplies}, Total without replies: ${totalWithoutReplies}`);
    
    // If we have any replies in the database, the count with replies should be >= the count without
    if (totalWithReplies > 0 && totalWithoutReplies > 0) {
      assert(totalWithReplies >= totalWithoutReplies, 'Total count with replies should be >= total count without replies');
    }
  }, 20000);

  it('should include parent post titles for replies in search results', async function() {
    // Index a subplebbit to ensure we have data with replies
    const sub = await plebbit.getSubplebbit("plebtoken.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts/search?q=test&include-replies=true');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');

    // Check if any replies have parent title information
    const replies = response.body.posts.filter(post => post.parentCid);
    
    if (replies.length > 0) {
      console.log(`Found ${replies.length} replies with parent information`);
      
      // At least some replies should have parent titles
      const repliesWithParentTitles = replies.filter(reply => reply.postTitle);
      
      if (repliesWithParentTitles.length > 0) {
        console.log(`${repliesWithParentTitles.length} replies have post titles`);
        
        // Verify parent title structure
        repliesWithParentTitles.forEach(reply => {
          assert(typeof reply.postTitle === 'string', 'Post title should be a string');
          assert(reply.postTitle.length > 0, 'Post title should not be empty');
          console.log(`Reply to: "${reply.postTitle}"`);
        });
      }
    }
  }, 200000);

  it('should include parent information for replies in main posts endpoint', async function() {
    // Get posts including replies
    const response = await request.get('/api/posts?include-replies=true&limit=50');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return an array of posts');

    let topLevelPostsChecked = 0;
    let repliesChecked = 0;

    response.body.posts.forEach((post, index) => {
      // Verify that post information fields are present
      assert('postTitle' in post, `Post ${index} should have postTitle field`);
      assert('postAuthorDisplayName' in post, `Post ${index} should have postAuthorDisplayName field`);
      assert('postAuthorAddress' in post, `Post ${index} should have postAuthorAddress field`);

        repliesChecked++;
        console.log(`Reply ${post.id}: postTitle="${post.postTitle}", postAuthor="${post.postAuthorDisplayName}"`);
        
        // Post fields can be null if parent post doesn't exist or has null values,
        // but they should be defined in the response
        if (post.postTitle !== null) {
          assert(typeof post.postTitle === 'string', `Reply ${index} postTitle should be string or null`);
        }
        if (post.postAuthorDisplayName !== null) {
          assert(typeof post.postAuthorDisplayName === 'string', `Reply ${index} postAuthorDisplayName should be string or null`);
        }
        if (post.postAuthorAddress !== null) {
          assert(typeof post.postAuthorAddress === 'string', `Reply ${index} postAuthorAddress should be string or null`);
        }
    });

    console.log(`Verified parent information for ${topLevelPostsChecked} top-level posts and ${repliesChecked} replies`);
    
    // We should have checked at least some posts
    assert(topLevelPostsChecked + repliesChecked > 0, 'Should have verified at least some posts');
  }, 20000);

}, 20000); 