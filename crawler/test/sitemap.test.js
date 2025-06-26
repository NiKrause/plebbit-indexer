import { strict as assert } from 'assert';
import supertest from 'supertest';
import { jest, describe, it, beforeAll, afterAll } from '@jest/globals';
import { indexSubplebbit } from '../src/subplebbit.js';
import { startServer } from '../src/server/index.js';
import { getDb } from '../src/db.js';
import { getPlebbitClient } from '../src/plebbitClient.js';

let server;

describe('Sitemap functionality', () => {
  let request;
  let plebbit;
  let db;
  const targetSubplebbit = "plebtoken.eth";
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

  it('should generate a valid sitemap index and verify its contents', async function() {
    const sub = await plebbit.getSubplebbit(targetSubplebbit);
    await sub.update();
    
    // Index the subplebbit
    await indexSubplebbit(sub, db);

    // Get the sitemap index
    const response = await request.get('/sitemap.xml');
    
    // Verify response status and headers
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], 'application/xml');
    assert.equal(response.headers['content-encoding'], 'gzip');

    const xml = response.text;
    
    // Verify basic XML structure
    assert(xml.includes('<?xml'), 'Should contain XML declaration');
    assert(xml.includes('<urlset'), 'Should contain urlset element');
    assert(xml.includes('<url>'), 'Should contain url elements');
    assert(xml.includes('<loc>'), 'Should contain loc elements');
    
    // Verify homepage entry
    assert(xml.includes('<loc>https://plebscan.org/</loc>'), 'Should contain homepage URL');
    assert(xml.includes('<priority>1.0</priority>'), 'Should contain homepage priority');

    // Extract and verify sitemap URLs
    const sitemapUrls = xml.match(/<loc>.*?sitemap-\d+\.xml<\/loc>/g);
    // console.log("sitemapUrls", sitemapUrls);
    assert(sitemapUrls, 'Should contain sitemap URLs');
    // console.log(`Found ${sitemapUrls.length} sitemap URLs in index`);

    // Verify first sitemap file
    const firstSitemapMatch = sitemapUrls[0].match(/sitemap-(\d+)\.xml/);
    assert(firstSitemapMatch, 'Should be able to extract sitemap number');
    const firstSitemapNumber = firstSitemapMatch[1];

    // // Get and verify the first sitemap file
    const sitemapResponse = await request.get(`/sitemap-${firstSitemapNumber}.xml`);
    assert.equal(sitemapResponse.status, 200);
    
    const sitemapXml = sitemapResponse.text;
    assert(sitemapXml.includes('<urlset'), 'Should contain urlset element');
    
    // // Verify post URLs in the sitemap
    const postUrls = sitemapXml.match(/<loc>.*?\/p\/.*?\/c\/.*?<\/loc>/g);
    assert(postUrls, 'Should contain post URLs');
    console.log(`Found ${postUrls.length} post URLs in sitemap`);

    // // Verify URL structure
    postUrls.forEach(url => {
      const urlMatch = url.match(/<loc>(.*?)<\/loc>/);
      assert(urlMatch, 'Should be able to extract URL');
      const urlPath = urlMatch[1];
      assert(urlPath.startsWith('https://plebscan.org/p/'), 'URL should start with correct domain and path');
      assert(urlPath.includes('/c/'), 'URL should contain comment path');
    });
  }, 20000);
});