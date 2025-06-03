import { NextResponse } from 'next/server';

// Cache for the active crawler URL
let activeCrawlerUrl: string | null = null;

async function findActiveCrawler(): Promise<string> {
  // If we already found an active crawler, return it
  if (activeCrawlerUrl) {
    return activeCrawlerUrl;
  }

  // Try crawler01 first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://crawler01:3001/api/posts?limit=1', { 
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      activeCrawlerUrl = 'http://crawler01:3001';
      return activeCrawlerUrl;
    }
  } catch {
    console.log('crawler01 not available, trying crawler02');
  }

  // Try crawler02 if crawler01 failed
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch('http://crawler02:3001/api/posts?limit=1', {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      activeCrawlerUrl = 'http://crawler02:3001';
      return activeCrawlerUrl;
    }
  } catch {
    console.log('crawler02 not available');
  }

  // If both fail, default to crawler01
  activeCrawlerUrl = 'http://crawler01:3001';
  return activeCrawlerUrl;
}

export async function GET() {
  try {
    const apiBaseUrl = await findActiveCrawler();
    const baseEndpoint = 'sitemap.xml';
    const url = `${apiBaseUrl}/${baseEndpoint}`;
    
    console.log("Fetching sitemap URL:", url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(url, { 
      headers: {
        'Accept': 'application/xml'
      },
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // If the request fails, clear the cached URL to try finding a new active crawler next time
      activeCrawlerUrl = null;
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }

    const sitemap = await response.text();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}