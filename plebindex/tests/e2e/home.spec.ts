import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should load the home page and display key elements', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Check if the page title is correct
    await expect(page).toHaveTitle(/PlebIndex/);

    // Verify header elements
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Plebscan')).toBeVisible();
    
    // Check if search bar is present
    await expect(page.getByRole('searchbox')).toBeVisible();

    // Verify social links
    await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Telegram' })).toBeVisible();
  });

  test('cookie consent should be visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('sitemap.xml should be accessible and contain valid XML', async ({ page }) => {
    // Navigate to the sitemap
    const response = await page.goto('/sitemap.xml');
    
    // Check if the response is successful
    expect(response?.status()).toBe(200);
    
    // Verify content type is XML
    expect(response?.headers()['content-type']).toContain('application/xml');
    
    // Get the sitemap content
    const content = await response?.text();
    
    // Verify basic XML structure
    expect(content).toContain('<?xml');
    expect(content).toContain('<urlset');
    expect(content).toContain('<url>');
    expect(content).toContain('<loc>');
    
    // Verify homepage entry
    expect(content).toContain('<loc>https://plebscan.com/</loc>');
    expect(content).toContain('<priority>1.0</priority>');
    
    // Verify sitemap URLs are present
    const sitemapUrls = content?.match(/<loc>.*?sitemap-\d+\.xml<\/loc>/g);
    expect(sitemapUrls).toBeTruthy();
    
    // If sitemap URLs are found, verify the first one
    if (sitemapUrls && sitemapUrls.length > 0) {
      const firstSitemapMatch = sitemapUrls[0].match(/sitemap-(\d+)\.xml/);
      expect(firstSitemapMatch).toBeTruthy();
      
      // // Get and verify the first sitemap file
      const sitemapNumber = firstSitemapMatch![1];
      const sitemapResponse = await page.goto(`/sitemap-${sitemapNumber}.xml`);
      // console.log("sitemapResponse", sitemapResponse);
      expect(sitemapResponse?.status()).toBe(200); 
      const sitemapContent = await sitemapResponse?.text();
      
      // // Verify post URLs in the sitemap
      const postUrls = sitemapContent?.match(/<loc>.*?\/p\/.*?\/c\/.*?<\/loc>/g);
      expect(postUrls).toBeTruthy();
      
      // // Verify URL structure
      postUrls?.forEach(url => {
        const urlMatch = url.match(/<loc>(.*?)<\/loc>/);
        expect(urlMatch).toBeTruthy();
        const urlPath = urlMatch![1];
        expect(urlPath).toMatch(/^https:\/\/plebscan\.com\/p\/.*\/c\/.*$/);
      });
    }
  });

  test.only('should find specific post through search', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');

    // Find and fill the search box
    const searchBox = page.getByRole('searchbox');
    await searchBox.fill('Great post, really insightful and some very creative ideas');
    await searchBox.press('Enter');

    // Wait for search results to load
    await page.waitForLoadState('networkidle');

    // Verify the post title
    await expect(page.getByText('Plebbit is super fast now, where is everybody?')).toBeVisible();

    // Verify the subplebbit
    await expect(page.getByText('plebtoken.eth')).toBeVisible();

    // Verify it's marked as a reply by checking for the reply styling
    const replyElement = page.locator('div[style*="border-left"]');
    await expect(replyElement).toBeVisible();
  });
});
