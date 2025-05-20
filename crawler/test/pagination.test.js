import { strict as assert } from 'assert';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
import { indexSubplebbit } from '../src/subplebbit.js';
import supertest from 'supertest';

describe('Pagination functionality', function () {
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
  }, 20000);

  it('should support pagination on the posts endpoint', async function() {

    // First request - page 1, limit 5
    const response1 = await request.get('/api/posts?page=1&limit=5');
    assert.equal(response1.status, 200);
    assert(response1.body.posts, 'Response should contain posts array');
    assert(response1.body.pagination, 'Response should contain pagination data');
    assert.equal(response1.body.pagination.page, 1);
    assert.equal(response1.body.pagination.limit, 5);
    assert(response1.body.pagination.total > 0, 'Total should be greater than 0');
    assert(response1.body.posts.length <= 5, 'Should return at most 5 posts');
    
    // If we have more than 5 posts, check page 2
    if (response1.body.pagination.total > 5) {
      const response2 = await request.get('/api/posts?page=2&limit=5');
      assert.equal(response2.status, 200);
      assert(response2.body.posts, 'Response should contain posts array');
      assert.equal(response2.body.pagination.page, 2);
      
      // Check if posts on page 2 are different from page 1
      const page1Ids = response1.body.posts.map(post => post.id);
      const page2Ids = response2.body.posts.map(post => post.id);
      
      // No post IDs should be in both pages
      const commonIds = page1Ids.filter(id => page2Ids.includes(id));
      assert.equal(commonIds.length, 0, 'Posts should not be duplicated across pages');
    }
  }, 30000);

  it('should support pagination on the search endpoint', async function() {
    // First, index a subplebbit that's likely to have multiple posts
    const sub = await plebbit.getSubplebbit("plebpiracy.eth");
    await sub.update();
    await indexSubplebbit(sub, db);
    
    // Use a common term that should be found in multiple posts
    const searchTerm = "plebbit";
    
    // // First request - page 1, limit 3
    const response1 = await request.get(`/api/posts/search?q=${searchTerm}&page=1&limit=3`);
    console.log("response1", response1.body);
    console.log("response1.body.posts", response1.body.posts);
    console.log("response1.body.pagination", response1.body.pagination);
    assert.equal(response1.status, 200);
    assert(response1.body.posts, 'Response should contain posts array');
    assert(response1.body.pagination, 'Response should contain pagination data');
    assert.equal(response1.body.pagination.page, 1);
    assert.equal(response1.body.pagination.limit, 3);
    
    // // If we have more than 3 search results, check page 2
    if (response1.body.pagination.total > 3) {
      const response2 = await request.get(`/api/posts/search?q=${searchTerm}&page=2&limit=3`);
      assert.equal(response2.status, 200);
      assert(response2.body.posts, 'Response should contain posts array');
      assert.equal(response2.body.pagination.page, 2);
      
      // Check if posts on page 2 are different from page 1
      const page1Ids = response1.body.posts.map(post => post.id);
      const page2Ids = response2.body.posts.map(post => post.id);
      
      // No post IDs should be in both pages
      const commonIds = page1Ids.filter(id => page2Ids.includes(id));
      assert.equal(commonIds.length, 0, 'Search results should not be duplicated across pages');
    }
  }, 30000);

  it('should return all posts when limit is 0', async function() {
    // First get total count of posts
    const countResponse = await request.get('/api/posts?page=1&limit=1');
    const totalPosts = countResponse.body.pagination.total;
    console.log("totalPosts", totalPosts);
    // Then get all posts with limit=0
    const response = await request.get('/api/posts?limit=0');
    assert.equal(response.status, 200);
    assert.equal(response.body.posts.length, totalPosts, 'Should return all posts');
    assert.equal(response.body.pagination.pages, 1, 'Should have just one page');
    assert.equal(response.body.pagination.limit, totalPosts, 'Limit should match total posts');
  }, 30000);

  it('should return all search results when limit is 0', async function() {
    // First get total count of search results for a common term
    const searchTerm = "plebbit";
    const countResponse = await request.get(`/api/posts/search?q=${searchTerm}&page=1&limit=1`);
    const totalResults = countResponse.body.pagination.total;
    
    if (totalResults > 0) {
      // Then get all search results with limit=0
      const response = await request.get(`/api/posts/search?q=${searchTerm}&limit=0`);
      assert.equal(response.status, 200);
      assert.equal(response.body.posts.length, totalResults, 'Should return all search results');
      assert.equal(response.body.pagination.pages, 1, 'Should have just one page');
      assert.equal(response.body.pagination.limit, totalResults, 'Limit should match total results');
    }
  }, 30000);
}, 60000); 