import { strict as assert } from 'assert';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';
import { indexSubplebbit } from '../src/subplebbit.js';
import supertest from 'supertest';

describe('Sorting functionality', function () {
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

  // Helper function to test sorting
  async function testSorting(sortType, expectedOrder) {
    const response = await request.get(`/api/posts?sort=${sortType}`);
    console.log("response", response.body);
    assert.equal(response.status, 200);
    assert(response.body.posts, `Response should contain posts array for sort=${sortType}`);
    assert(response.body.filters, `Response should contain filters data for sort=${sortType}`);
    assert.equal(response.body.filters.sort, sortType, `Response filters should show sort=${sortType}`);
    
    // Only test ordering if we have enough posts and expectedOrder is provided
    if (response.body.posts.length > 1 && expectedOrder) {
      const orderField = getOrderField(sortType);
      let isCorrectOrder = true;
      
      for (let i = 0; i < response.body.posts.length - 1; i++) {
        const current = response.body.posts[i];
        const next = response.body.posts[i + 1];
        
        if (expectedOrder === 'desc') {
          if (getFieldValue(current, sortType) < getFieldValue(next, sortType)) {
            isCorrectOrder = false;
            break;
          }
        } else {
          if (getFieldValue(current, sortType) > getFieldValue(next, sortType)) {
            isCorrectOrder = false;
            break;
          }
        }
      }
      
      assert(isCorrectOrder, `Posts should be sorted in ${expectedOrder} order by ${orderField} for sort=${sortType}`);
    }
    
    return response.body;
  }
  
  // Helper to get the field to compare based on sort type
  function getOrderField(sortType) {
    switch (sortType) {
      case 'top': return 'upvoteCount-downvoteCount';
      case 'replies': return 'replyCount';
      case 'new': 
      case 'old': return 'timestamp';
      default: return 'timestamp';
    }
  }
  
  // Helper to get the comparable value based on sort type
  function getFieldValue(post, sortType) {
    switch (sortType) {
      case 'top': return (post.upvoteCount || 0) - (post.downvoteCount || 0);
      case 'replies': return post.replyCount || 0;
      case 'new': 
      case 'old': return post.timestamp || 0;
      default: return post.timestamp || 0;
    }
  }
  
  // Helper function to test time filtering
  async function testTimeFilter(timeFilter) {
    const response = await request.get(`/api/posts?t=${timeFilter}`);
    assert.equal(response.status, 200);
    assert(response.body.posts, `Response should contain posts array for timeFilter=${timeFilter}`);
    assert(response.body.filters, `Response should contain filters data for timeFilter=${timeFilter}`);
    assert.equal(response.body.filters.timeFilter, timeFilter, `Response filters should show timeFilter=${timeFilter}`);
    
    // Check if posts are within time range
    if (timeFilter !== 'all' && response.body.posts.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      let timeOffset;
      
      switch (timeFilter) {
        case 'hour': timeOffset = 60 * 60; break;
        case 'day': timeOffset = 60 * 60 * 24; break;
        case 'week': timeOffset = 60 * 60 * 24 * 7; break;
        case 'month': timeOffset = 60 * 60 * 24 * 30; break;
        case 'year': timeOffset = 60 * 60 * 24 * 365; break;
        default: timeOffset = 0;
      }
      
      const cutoffTime = now - timeOffset;
      const allPostsWithinTimeframe = response.body.posts.every(post => 
        post.timestamp >= cutoffTime
      );
      
      assert(allPostsWithinTimeframe, `All posts should have timestamps after the ${timeFilter} cutoff`);
    }
    
    return response.body;
  }

  it('should support sorting by top, replies, new, and old', async function() {
    // Index test data
    const sub = await plebbit.getSubplebbit("plebtoken.eth");
    await sub.update();
    await indexSubplebbit(sub, db);

    // Test default sort (new)
    const defaultResponse = await request.get('/api/posts');
    assert.equal(defaultResponse.status, 200);
    assert(defaultResponse.body.posts, 'Response should contain posts array');
    assert(defaultResponse.body.pagination, 'Response should contain pagination data');
    assert(defaultResponse.body.filters, 'Response should contain filters data');
    assert.equal(defaultResponse.body.filters.sort, 'new', 'Default sort should be new');
    
    // Test each sort type
    await testSorting('top', 'desc');
    await testSorting('replies', 'desc');
    await testSorting('new', 'desc');
    await testSorting('old', 'asc');
  }, 30000);
  
  it('should support time filtering', async function() {
    // Test default time filter (all)
    const defaultResponse = await request.get('/api/posts');
    assert.equal(defaultResponse.status, 200);
    assert.equal(defaultResponse.body.filters.timeFilter, 'all', 'Default time filter should be all');
    
    // Test each time filter
    await testTimeFilter('all');
    await testTimeFilter('hour');
    await testTimeFilter('day');
    await testTimeFilter('week');
    await testTimeFilter('month');
    await testTimeFilter('year');
  }, 30000);
  
  it('should support combining sorting and time filtering', async function() {
    // Test combinations
    const combinations = [
      { sort: 'top', time: 'week' },
      { sort: 'replies', time: 'month' },
      { sort: 'new', time: 'day' },
      { sort: 'old', time: 'year' }
    ];
    
    for (const { sort, time } of combinations) {
      const response = await request.get(`/api/posts?sort=${sort}&t=${time}`);
      assert.equal(response.status, 200);
      assert(response.body.posts, `Response should contain posts array for sort=${sort}, time=${time}`);
      assert.equal(response.body.filters.sort, sort, `Response filters should show sort=${sort}`);
      assert.equal(response.body.filters.timeFilter, time, `Response filters should show timeFilter=${time}`);
    }
  }, 30000);
  
  it('should support sorting and time filtering in search', async function() {
    // Add a search term that should match something
    const searchTerm = "plebtoken";
    
    // Test default search
    const defaultSearch = await request.get(`/api/posts/search?q=${searchTerm}`);
    assert.equal(defaultSearch.status, 200);
    assert(defaultSearch.body.posts.length > 0, 'Search should return results');
    assert.equal(defaultSearch.body.filters.sort, 'new', 'Default search sort should be new');
    assert.equal(defaultSearch.body.filters.timeFilter, 'all', 'Default search time filter should be all');
    
    // Test search with sorting
    const sortTypes = ['top', 'replies', 'new', 'old'];
    for (const sort of sortTypes) {
      const response = await request.get(`/api/posts/search?q=${searchTerm}&sort=${sort}`);
      assert.equal(response.status, 200);
      assert(response.body.posts.length > 0, `Search with sort=${sort} should return results`);
      assert.equal(response.body.filters.sort, sort, `Search filters should show sort=${sort}`);
    }
    
    // Test search with time filtering
    const timeFilters = ['all', 'hour', 'day', 'week', 'month', 'year'];
    for (const time of timeFilters) {
      const response = await request.get(`/api/posts/search?q=${searchTerm}&t=${time}`);
      assert.equal(response.status, 200);
      assert.equal(response.body.filters.timeFilter, time, `Search filters should show timeFilter=${time}`);
    }
    
    // Test search with combination of sort and time filter
    const response = await request.get(`/api/posts/search?q=${searchTerm}&sort=top&t=month`);
    assert.equal(response.status, 200);
    assert.equal(response.body.filters.sort, 'top', 'Search filters should show sort=top');
    assert.equal(response.body.filters.timeFilter, 'month', 'Search filters should show timeFilter=month');
  }, 30000);
});
