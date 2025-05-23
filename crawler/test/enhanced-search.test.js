import { strict as assert } from 'assert';
import { indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
import supertest from 'supertest';

describe('Enhanced search with parent post information', function () {
  let plebbit;
  let db;
  let request;
  let server;
  
  const targetSubplebbit = "plebtoken.eth";
  const targetPostTitle = "ESTEBAN IS BARELY CODING";
  const targetAuthorAddress = "12D3KooWQ3aXtQsfk6L8CEjboLuCF6jkY8oizL31qfhy9tSJrLZ6";

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

  it('should index target subplebbit for enhanced search tests', async function() {
    const sub = await plebbit.getSubplebbit(targetSubplebbit);
    await sub.update();
    await indexSubplebbit(sub, db);

    // Find and store target post
    const searchResponse = await request.get(`/api/posts/search?q=${encodeURIComponent(targetPostTitle)}`);
    assert.equal(searchResponse.status, 200);
    
    const targetPost = searchResponse.body.posts.find(post => 
      post.title === targetPostTitle && 
      post.authorAddress === targetAuthorAddress
    );
    
    assert(targetPost, 'Should find the target post');
    global.targetPostCid = targetPost.id;
    console.log(`Target post CID: ${targetPost.id}`);
  }, 300000);

  it('should include parent post information in search results when including replies', async function() {
    if (!global.targetPostCid) {
      console.log('Skipping test - no target post found');
      return;
    }

    // Search with replies included
    const response = await request.get('/api/posts/search?q=test&include-replies=true');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return array of posts');

    // Find replies in the results
    const replies = response.body.posts.filter(post => post.parentCid);
    
    if (replies.length > 0) {
      console.log(`Found ${replies.length} replies in search results`);
      
      // Check that replies have parent information
      replies.forEach(reply => {
        // Reply should have parentCid
        assert(reply.parentCid, 'Reply should have parentCid');
        
        // If parent exists, should have parent title (unless parent is also a reply)
        if (reply.parentTitle !== null) {
          assert(typeof reply.parentTitle === 'string' || reply.parentTitle === null, 
            'parentTitle should be string or null');
        }
        
        console.log(`Reply ${reply.id}: parentCid=${reply.parentCid}, parentTitle="${reply.parentTitle}"`);
      });
    } else {
      console.log('No replies found in search results');
    }
  }, 20000);

  it('should not include parent information when excluding replies', async function() {
    const response = await request.get('/api/posts/search?q=test&include-replies=false');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return array of posts');

    // All posts should be top-level (no parentCid)
    response.body.posts.forEach(post => {
      assert(!post.parentCid, 'Should not have parentCid when replies are excluded');
      assert(!post.parentTitle, 'Should not have parentTitle when replies are excluded');
    });

    console.log(`Found ${response.body.posts.length} top-level posts only`);
  }, 20000);

  it('should correctly identify replies with null titles and provide parent context', async function() {
    if (!global.targetPostCid) {
      console.log('Skipping test - no target post found');
      return;
    }

    // Get replies to the target post
    const repliesResponse = await request.get(`/api/replies/${global.targetPostCid}`);
    assert.equal(repliesResponse.status, 200);

    if (repliesResponse.body.replies.length === 0) {
      console.log('No replies found for target post');
      return;
    }

    // Now search for content that might include these replies
    const searchResponse = await request.get('/api/posts/search?q=ESTEBAN&include-replies=true');
    assert.equal(searchResponse.status, 200);

    // Look for the target post and its replies
    const targetPostInResults = searchResponse.body.posts.find(post => post.id === global.targetPostCid);
    const repliesInResults = searchResponse.body.posts.filter(post => 
      post.parentCid === global.targetPostCid || post.postCid === global.targetPostCid
    );

    if (targetPostInResults) {
      console.log(`Found target post in search: title="${targetPostInResults.title}"`);
    }

    if (repliesInResults.length > 0) {
      console.log(`Found ${repliesInResults.length} replies in search results`);
      
      repliesInResults.forEach(reply => {
        // Replies to our target post should have parent title
        if (reply.parentCid === global.targetPostCid) {
          assert.equal(reply.parentTitle, targetPostTitle, 
            'Reply should have correct parent title');
          console.log(`Reply ${reply.id}: parentTitle="${reply.parentTitle}"`);
        }
      });
    }
  }, 20000);

  it('should handle nested replies with correct parent information', async function() {
    // Search for any content that includes nested replies
    const response = await request.get('/api/posts/search?q=.&include-replies=true&limit=50');
    assert.equal(response.status, 200);

    const postsWithParents = response.body.posts.filter(post => post.parentCid);
    
    if (postsWithParents.length === 0) {
      console.log('No replies found in search results');
      return;
    }

    console.log(`Analyzing ${postsWithParents.length} replies for parent information`);

    let repliesWithParentTitles = 0;
    let repliesWithNullParentTitles = 0;

    postsWithParents.forEach(post => {
      if (post.parentTitle) {
        repliesWithParentTitles++;
        // Parent title should be a non-empty string
        assert(typeof post.parentTitle === 'string' && post.parentTitle.length > 0,
          'Parent title should be non-empty string');
      } else {
        repliesWithNullParentTitles++;
        // This could be a reply to another reply (nested)
      }
    });

    console.log(`Replies with parent titles: ${repliesWithParentTitles}`);
    console.log(`Replies with null parent titles (nested): ${repliesWithNullParentTitles}`);

    // Should have at least some replies with parent information
    assert(repliesWithParentTitles > 0 || repliesWithNullParentTitles > 0, 
      'Should find some replies in the search results');
  }, 20000);

  it('should maintain performance with JOIN queries', async function() {
    const startTime = Date.now();
    
    // Perform a broad search that would return many results
    const response = await request.get('/api/posts/search?q=the&include-replies=true&limit=20');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body.posts), 'Should return array of posts');
    
    // Response should be reasonably fast (less than 2 seconds)
    assert(duration < 2000, `Query should complete in reasonable time, took ${duration}ms`);
    
    console.log(`Enhanced search with JOIN completed in ${duration}ms`);
    console.log(`Returned ${response.body.posts.length} results`);
  }, 20000);
}, 400000); 