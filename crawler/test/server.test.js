import { strict as assert } from 'assert';
import supertest from 'supertest';
import '../src/app/server/index.js'; // Ensure your server is running

const request = supertest('http://localhost:3001');

describe('GET /api/posts', function () {
  it('should return an array of posts', async function () {
    const response = await request.get('/api/posts');
    assert.equal(response.status, 200);
    assert(Array.isArray(response.body), 'Response should be an array');
    if (response.body.length > 0) {
      assert('id' in response.body[0], 'Post should have an id');
    }
  });
});