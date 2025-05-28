import { FlaggedPost, AdminStats } from '../types';

function getApiBaseUrl(): string {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBaseUrl && process.env.NODE_ENV === 'development') {
    apiBaseUrl = 'http://localhost:3001';
  } 
  console.log("apiBaseUrl-admin ", apiBaseUrl);
  return apiBaseUrl || '';
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('plebbit_admin_auth');
  }
  return null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchFlaggedPosts(
  page: number = 1, 
  limit: number = 25,
  reason?: string,
  status: 'pending' | 'moderated' = 'pending'
): Promise<{ flagged_posts: FlaggedPost[], pagination: PaginationInfo } | null> {
  const apiBaseUrl = getApiBaseUrl();
  const authToken = getAuthToken();
  
  if (!authToken) {
    throw new Error('No authentication token found');
  }
  
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('auth', authToken);
  if (reason) {
    params.append('reason', reason);
  }
  params.append('status', status);
  
  const baseEndpoint = `api/flagged-posts?${params.toString()}`;
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
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
    return data;
  } catch (error) {
    console.error('Error fetching flagged posts:', error);
    return null;
  }
}

export async function takeModerationAction(postId: string, action: string): Promise<boolean> {
  const apiBaseUrl = getApiBaseUrl();
  const authToken = getAuthToken();
  
  if (!authToken) {
    throw new Error('No authentication token found');
  }
  
  const baseEndpoint = `api/admin/moderate/${postId}`;
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, auth: authToken })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to take moderation action');
    }
    
    return true;
  } catch (error) {
    console.error('Error taking moderation action:', error);
    throw error;
  }
}

export async function getFlaggedPostsStats(): Promise<AdminStats | null> {
  const apiBaseUrl = getApiBaseUrl();
  const authToken = getAuthToken();
  
  if (!authToken) {
    throw new Error('No authentication token found');
  }
  
  const params = new URLSearchParams();
  params.append('auth', authToken);
  
  const baseEndpoint = `api/flagged-posts/stats?${params.toString()}`;
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
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
    return data;
  } catch (error) {
    console.error('Error fetching flagged posts stats:', error);
    return null;
  }
} 