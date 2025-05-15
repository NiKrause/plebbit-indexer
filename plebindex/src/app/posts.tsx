// app/Posts.tsx

import { Suspense } from 'react';
import moment from 'moment';

interface Post {
  id: string;
  title: string;
  content: string;
  subplebbitAddress: string;
  authorAddress: string;
  authorDisplayName: string;
  timestamp: number;
}

async function fetchPosts(searchTerm?: string | null) {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl && process.env.NODE_ENV === 'development') {
    apiBaseUrl = 'http://crawler:3001';
  } else if (!apiBaseUrl) {
    apiBaseUrl = '';  
  }
  
  const endpoint = searchTerm ? `/api/posts/search?q=${encodeURIComponent(searchTerm)}` : '/api/posts';
  const url = apiBaseUrl ? `${apiBaseUrl}${endpoint}` : endpoint;
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
    
    const data = await response.json() as Post[];
    
    // Sort posts by timestamp (newest first)
    return [...data].sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Return mock data in development for testing
    if (process.env.NODE_ENV === 'development') {
      return getMockPosts();
    }
    return [];
  }
}

// Provide mock data for development if API fails
function getMockPosts(): Post[] {
  return [
    {
      id: 'mock1',
      title: 'Mock Post 1',
      content: 'This is a mock post for testing when the API is unavailable.',
      subplebbitAddress: 'mock',
      authorAddress: 'mockuser',
      authorDisplayName: 'Mock User',
      timestamp: Math.floor(Date.now() / 1000) - 3600
    },
    {
      id: 'mock2',
      title: 'Mock Post 2',
      content: 'Another mock post for development.',
      subplebbitAddress: 'mock',
      authorAddress: 'mockuser2',
      authorDisplayName: 'Developer',
      timestamp: Math.floor(Date.now() / 1000) - 7200
    }
  ];
}

function formatTimestamp(timestamp: number) {
  return moment(timestamp*1000).fromNow();
}

async function PostsContent({ searchTerm }: { searchTerm?: string | null }) {
  const posts = await fetchPosts(searchTerm);

  return (
    <div>
      <h2>{searchTerm ? `Search Results for "${searchTerm}"` : 'All Posts'}</h2>
      <div>
        {posts.map(post => (
          <div key={post.id} style={{ borderBottom: '1px solid #ccc', marginBottom: 16, paddingBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#888' }}>
              <a
                href={`https://seedit.app/#/p/${post.subplebbitAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#888', textDecoration: 'underline' }}
              >
                r/{post.subplebbitAddress}
              </a>
              {' • Posted by '}
              <a
                href={`https://seedit.app/#/u/${post.authorAddress}/c/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#888', textDecoration: 'underline' }}
              >
                {post.authorDisplayName || post.authorAddress}
              </a>
              {' • '}
              <span title={new Date(post.timestamp).toLocaleString()}>
                {formatTimestamp(post.timestamp)}
              </span>
            </div>
            <a
              href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 'bold', fontSize: 18 }}
            >
              {post.title}
            </a>
            <div style={{ marginTop: 4 }}>{post.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Posts({ searchParams }: { searchParams?: { q?: string } }) {
  // Get the search parameter from URL query
  const searchTerm = (await searchParams)?.q || null;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsContent searchTerm={searchTerm} />
    </Suspense>
  );
}