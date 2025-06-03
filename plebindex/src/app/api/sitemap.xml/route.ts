// plebindex/src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';

function getApiBaseUrl(): string | undefined {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBaseUrl && process.env.NODE_ENV === 'development') {
    if(typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      apiBaseUrl = 'http://localhost:3001';
    }
  } 
  return apiBaseUrl;
}

export async function GET() {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const baseEndpoint = 'sitemap.xml';
    const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
    
    console.log("Fetching sitemap URL:", url);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/xml'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }

    const sitemap = await response.text();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Encoding': 'gzip',
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}