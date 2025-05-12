import { strict as assert } from 'assert';
import { getSubplebbitAddresses, indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import Plebbit from '@plebbit/plebbit-js';
import supertest from 'supertest';

describe('Subplebbit functionality', function () {
  let plebbit;
  let db;
  let request;
  let server;

  beforeAll(async function() {
    plebbit = await Plebbit();
    db = await getDb();
    request = supertest('http://localhost:3001');
    server = startServer();
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

   it('should check if posts are available', async function() {
    const response = await request.get('/api/posts');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body), 'Should return an array of posts');
    assert(response.body.length > 0, 'Should return at least one post');
   }, 20000);

  it('should get subplebbit addresses', async function() {
    const addresses = await getSubplebbitAddresses();
    assert(Array.isArray(addresses), 'Should return an array of addresses');
    assert(addresses.length > 0, 'Should return at least one address');
  });

  it('should index the first subplebbit and be queryable via API', async function() {
    const addresses = await getSubplebbitAddresses();
    const firstAddress = addresses[0];
    const sub = await plebbit.getSubplebbit(firstAddress);
    await sub.update();
    await indexSubplebbit(sub, db);

    const response = await request.get('/api/posts');
    assert.equal(response.status, 200); 
    assert(Array.isArray(response.body), 'Should return an array of posts');
    assert(response.body.length > 0, 'Should return at least one post');
    assert('id' in response.body[0], 'Post should have an id');
  }, 200000);

  it('should search posts for the word "piracy"', async function() {
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

}, 20000); 