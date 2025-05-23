import { strict as assert } from 'assert';
import { indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
import supertest from 'supertest';

describe('Reply indexing functionality', function () {
  let plebbit;
  let db;
  let request;
  let server;
  
  // Target post information
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

  it('should check if db is open', async function() {
    assert(db, 'DB should be open');
  }, 20000);

  it('should index the target subplebbit and find the specific post', async function() {
    // Get the subplebbit object
    const sub = await plebbit.getSubplebbit(targetSubplebbit);
    await sub.update();
    
    // Index the subplebbit
    await indexSubplebbit(sub, db);

    // Search for the post by title
    const searchResponse = await request.get(`/api/posts/search?q=${encodeURIComponent(targetPostTitle)}`);
    assert.equal(searchResponse.status, 200);
    assert(Array.isArray(searchResponse.body.posts), 'Should return an array of posts');
    console.log("searchResponse.body.posts.length", searchResponse.body.posts.length);
    // Find the target post
    const targetPost = searchResponse.body.posts.find(post => 
      post.title === targetPostTitle && 
      post.authorAddress === targetAuthorAddress
    );
    
    assert(targetPost, `Should find the specific post "${targetPostTitle}" by author ${targetAuthorAddress}`);
    console.log(`Found target post with CID: ${targetPost.id}`);
    
    // Store the post ID for later tests
    global.targetPostCid = targetPost.id;
    
    // Verify the post has replies
    assert(targetPost.replyCount > 0, 'Target post should have replies');
    console.log(`Target post has ${targetPost.replyCount} replies`);
  }, 300000); // Increased timeout for indexing

  it('should verify that replies are indexed and accessible through API', async function() {
    // Skip if we don't have the target post CID
    if (!global.targetPostCid) {
      console.log('Skipping test because target post was not found');
      return;
    }
    
    // Get replies for the target post
    const repliesResponse = await request.get(`/api/replies/${global.targetPostCid}`);
    assert.equal(repliesResponse.status, 200);
    assert(Array.isArray(repliesResponse.body.replies), 'Should return an array of replies');
    assert(repliesResponse.body.replies.length > 0, 'Should have at least one reply');
    
    console.log(`Retrieved ${repliesResponse.body.replies.length} replies for the post`);
    console.log(`Total replies reported: ${repliesResponse.body.pagination.total}`);
    
    // Verify each reply has the correct parent reference
    repliesResponse.body.replies.forEach(reply => {
      assert.equal(reply.parentCid, global.targetPostCid, 'Reply should reference the correct parent');
      assert.equal(reply.postCid, global.targetPostCid, 'Reply should reference the correct post');
    });
    
    // Verify first reply has expected fields
    const firstReply = repliesResponse.body.replies[0];
    assert(firstReply.id, 'Reply should have an ID');
    assert(firstReply.content, 'Reply should have content');
    assert(firstReply.authorAddress, 'Reply should have an author address');
    assert(firstReply.timestamp, 'Reply should have a timestamp');
    
    // Verify parent information fields are present (new JOIN functionality)
    assert('parentTitle' in firstReply, 'Reply should have parentTitle field');
    assert('parentAuthorDisplayName' in firstReply, 'Reply should have parentAuthorDisplayName field');
    assert('parentAuthorAddress' in firstReply, 'Reply should have parentAuthorAddress field');
    
    console.log(`First reply parent info: title="${firstReply.parentTitle}", author="${firstReply.parentAuthorDisplayName}"`);
  }, 20000);

  it('should verify parent information is correctly populated for replies', async function() {
    // Skip if we don't have the target post CID
    if (!global.targetPostCid) {
      console.log('Skipping test because target post was not found');
      return;
    }
    
    // First, get the original target post to compare parent info
    const originalPostResponse = await request.get(`/api/posts/${global.targetPostCid}`);
    assert.equal(originalPostResponse.status, 200);
    const originalPost = originalPostResponse.body.post;
    
    // Get replies for the target post
    const repliesResponse = await request.get(`/api/replies/${global.targetPostCid}`);
    assert.equal(repliesResponse.status, 200);
    assert(repliesResponse.body.replies.length > 0, 'Should have at least one reply');
    
    // Verify each reply has correct parent information
    repliesResponse.body.replies.forEach((reply, index) => {
      // Since these are direct replies to the original post, parent info should match original post
      assert.equal(reply.parentCid, global.targetPostCid, `Reply ${index} should have correct parentCid`);
      assert.equal(reply.parentTitle, originalPost.title, `Reply ${index} should have correct parentTitle`);
      assert.equal(reply.parentAuthorDisplayName, originalPost.authorDisplayName, `Reply ${index} should have correct parentAuthorDisplayName`);
      assert.equal(reply.parentAuthorAddress, originalPost.authorAddress, `Reply ${index} should have correct parentAuthorAddress`);
      
      console.log(`Reply ${index}: parentTitle="${reply.parentTitle}", parentAuthor="${reply.parentAuthorDisplayName}"`);
    });
    
    console.log(`Verified parent information for ${repliesResponse.body.replies.length} replies`);
  }, 20000);

  it('should verify nested replies are properly indexed', async function() {
    // Skip if we don't have the target post CID
    if (!global.targetPostCid) {
      console.log('Skipping test because target post was not found');
      return;
    }
    
    // Get all replies for the target post
    const allRepliesResponse = await request.get(`/api/replies/${global.targetPostCid}?limit=100`);
    assert.equal(allRepliesResponse.status, 200);
    
    const replies = allRepliesResponse.body.replies;
    if (replies.length === 0) {
      console.log('No replies found, skipping nested reply check');
      return;
    }
    
    // Find a reply that might have nested replies
    const potentialParentReply = replies[0];
    
    // Check if any replies have this reply as a parent
    const nestedRepliesResponse = await request.get(`/api/replies/${potentialParentReply.id}`);
    
    // Log results whether we found nested replies or not
    console.log(`Checked for nested replies to comment ${potentialParentReply.id}`);
    console.log(`Found ${nestedRepliesResponse.body.pagination.total} nested replies`);
    
    if (nestedRepliesResponse.body.pagination.total > 0) {
      // If we found nested replies, verify they have correct references
      nestedRepliesResponse.body.replies.forEach((nestedReply, index) => {
        assert.equal(nestedReply.parentCid, potentialParentReply.id, 'Nested reply should reference the correct parent');
        assert.equal(nestedReply.postCid, global.targetPostCid, 'Nested reply should reference the original post');
        
        // Verify parent information fields are present
        assert('parentTitle' in nestedReply, `Nested reply ${index} should have parentTitle field`);
        assert('parentAuthorDisplayName' in nestedReply, `Nested reply ${index} should have parentAuthorDisplayName field`);
        assert('parentAuthorAddress' in nestedReply, `Nested reply ${index} should have parentAuthorAddress field`);
        
        // For nested replies, parent info should match the immediate parent (the reply they're replying to)
        assert.equal(nestedReply.parentTitle, potentialParentReply.title, `Nested reply ${index} should have correct parentTitle`);
        assert.equal(nestedReply.parentAuthorDisplayName, potentialParentReply.authorDisplayName, `Nested reply ${index} should have correct parentAuthorDisplayName`);
        assert.equal(nestedReply.parentAuthorAddress, potentialParentReply.authorAddress, `Nested reply ${index} should have correct parentAuthorAddress`);
        
        console.log(`Nested reply ${index}: replying to "${nestedReply.parentTitle}" by ${nestedReply.parentAuthorDisplayName}`);
      });
    }
  }, 20000);

  it('should verify pagination works with replies', async function() {
    // Skip if we don't have the target post CID
    if (!global.targetPostCid) {
      console.log('Skipping test because target post was not found');
      return;
    }
    
    // Get first page with small limit to force pagination
    const pageSize = 5;
    const firstPageResponse = await request.get(`/api/replies/${global.targetPostCid}?limit=${pageSize}&page=1`);
    assert.equal(firstPageResponse.status, 200);
    
    const totalReplies = firstPageResponse.body.pagination.total;
    const totalPages = firstPageResponse.body.pagination.pages;
    
    console.log(`Total replies: ${totalReplies}, Total pages: ${totalPages}`);
    
    // If we have enough replies for at least 2 pages
    if (totalPages > 1) {
      // Get second page
      const secondPageResponse = await request.get(`/api/replies/${global.targetPostCid}?limit=${pageSize}&page=2`);
      assert.equal(secondPageResponse.status, 200);
      assert(Array.isArray(secondPageResponse.body.replies), 'Should return an array of replies');
      
      // Verify we got different replies on different pages
      const firstPageIds = new Set(firstPageResponse.body.replies.map(r => r.id));
      const secondPageIds = new Set(secondPageResponse.body.replies.map(r => r.id));
      
      // Check that there's no overlap between pages
      const hasOverlap = [...secondPageIds].some(id => firstPageIds.has(id));
      assert(!hasOverlap, 'Second page should contain different replies than first page');
      
      console.log(`First page has ${firstPageResponse.body.replies.length} replies`);
      console.log(`Second page has ${secondPageResponse.body.replies.length} replies`);
    }
  }, 20000);

  it('should verify different sorting options for replies', async function() {
    // Skip if we don't have the target post CID
    if (!global.targetPostCid) {
      console.log('Skipping test because target post was not found');
      return;
    }
    
    // Test various sort options
    const sortOptions = ['new', 'old', 'top'];
    
    for (const sortOption of sortOptions) {
      const response = await request.get(`/api/replies/${global.targetPostCid}?sort=${sortOption}&limit=10`);
      assert.equal(response.status, 200);
      assert(Array.isArray(response.body.replies), `Should return an array of replies for sort=${sortOption}`);
      
      if (response.body.replies.length >= 2) {
        if (sortOption === 'new') {
          // For 'new' sort, newer replies (higher timestamp) should come first
          assert(response.body.replies[0].timestamp >= response.body.replies[1].timestamp, 
            'Replies should be sorted by timestamp descending for sort=new');
        } else if (sortOption === 'old') {
          // For 'old' sort, older replies (lower timestamp) should come first
          assert(response.body.replies[0].timestamp <= response.body.replies[1].timestamp, 
            'Replies should be sorted by timestamp ascending for sort=old');
        } else if (sortOption === 'top') {
          // For 'top' sort, replies with higher score should come first
          const score1 = (response.body.replies[0].upvoteCount || 0) - (response.body.replies[0].downvoteCount || 0);
          const score2 = (response.body.replies[1].upvoteCount || 0) - (response.body.replies[1].downvoteCount || 0);
          assert(score1 >= score2, 'Replies should be sorted by score descending for sort=top');
        }
      }
      
      console.log(`Sort=${sortOption} returned ${response.body.replies.length} replies`);
    }
  }, 20000);
}, 400000); // Extended overall timeout 