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

  it.only('should index the first subplebbit and be queryable via API', async function() {
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

  it.only('should check if posts are available', async function() { //when we have fresh db this will fail
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

}, 20000); 