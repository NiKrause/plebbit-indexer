import { Post, PaginatedResponse, PaginatedRepliesResponse } from '../types';

function getApiBaseUrl(): string | undefined {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  console.log("apiBaseUrl", apiBaseUrl);
  if (apiBaseUrl && process.env.NODE_ENV === 'development') {
    if(typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      apiBaseUrl = 'http://localhost:3001';
    }
  } 
  return apiBaseUrl;
}

export async function fetchPost(postId: string): Promise<Post | null> {
  const apiBaseUrl = getApiBaseUrl();
  const baseEndpoint = 'api/posts/' + postId;
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
  console.log("Fetching post URL:", url);
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'no-store', 
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

export async function fetchPosts(
  searchTerm?: string | null, 
  page: number = 1, 
  limit: number = 25,
  sort: string = 'new',
  timeFilter: string = 'all',
  includeReplies: boolean = true
): Promise<PaginatedResponse> {
  const apiBaseUrl = getApiBaseUrl();
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  // Only add sort if not the default
  if (sort !== 'new') {
    params.append('sort', sort);
  }
  
  // Only add time filter if not the default
  if (timeFilter !== 'all') {
    params.append('t', timeFilter);
  }
  
  // Only add include-replies if false (since true is default)
  if (!includeReplies) {
    params.append('include-replies', 'false');
  }
  
  // Create base endpoint
  const baseEndpoint = searchTerm 
    ? `/api/posts/search?q=${encodeURIComponent(searchTerm)}&${params.toString()}`
    : `/api/posts?${params.toString()}`;
    
  const url = apiBaseUrl ? `${apiBaseUrl}${baseEndpoint}` : baseEndpoint;
  console.log("url", url);
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'no-store', 
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log("fetched data", rawData);
    const data: PaginatedResponse = {
      posts: rawData.posts || [],
      pagination: { 
        total: rawData.pagination.total, 
        page, 
        limit, 
        pages: rawData.pagination.pages 
      },
      filters: {
        sort: rawData.filters?.sort || 'new',
        timeFilter: rawData.filters?.timeFilter || 'all',
        includeReplies: rawData.filters?.includeReplies !== undefined ? rawData.filters.includeReplies : true
      }
    };
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { 
      posts: [], 
      pagination: { total: 0, page: 1, limit: 25, pages: 0 },
      filters: { sort, timeFilter, includeReplies }
    };
  }
}

export async function fetchReplies(
  postId: string, 
  page: number = 1, 
  limit: number = 25,
  sort: string = 'new'
): Promise<PaginatedRepliesResponse> {
  const apiBaseUrl = getApiBaseUrl();
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  // Only add sort if not the default
  if (sort !== 'new') {
    params.append('sort', sort);
  }
  
  // Use the same URL pattern that works in posts.tsx
  const baseEndpoint = 'api/replies/' + postId + '?' + params.toString();
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
  console.log("Fetching replies URL:", url);
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'no-store', 
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("fetched replies data", data);
    return data;
  } catch (error) {
    console.error('Error fetching replies:', error);
    return { 
      replies: [], 
      pagination: { total: 0, page: 1, limit: 25, pages: 0 },
      filters: { sort }
    };
  }
}

export async function submitReport(postId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  const apiBaseUrl = getApiBaseUrl();
  console.log("submitting report to", apiBaseUrl);
  const baseEndpoint = `api/posts/${postId}/flag`;
  console.log("baseEndpoint", baseEndpoint);
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'submit-failed' };
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    return { success: false, error: 'network-error' };
  }
} 