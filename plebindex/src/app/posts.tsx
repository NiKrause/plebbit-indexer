// app/Posts.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import moment from 'moment';

type Post = {
  id: string;
  title: string;
  content: string;
  subplebbitAddress: string;
  authorAddress: string;
  authorDisplayName: string;
  timestamp: number;
};

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q');

  useEffect(() => {
    const checkApiEndpoint = async (url: string) => {
      try {
        const response = await fetch(url, { method: 'OPTIONS' });
        return response.ok;
      } catch {
        return false;
      }
    };

    const getApiBaseUrl = async () => {
      // First try NEXT_PUBLIC_API_BASE_URL if it exists
      if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        const isWorking = await checkApiEndpoint(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/posts`);
        if (isWorking) return process.env.NEXT_PUBLIC_API_BASE_URL;
      }

      // Then try window.location.origin
      if (typeof window !== 'undefined') {
        const isWorking = await checkApiEndpoint(`${window.location.origin}/api/posts`);
        if (isWorking) return window.location.origin;
      }

      // Fallback to localhost
      return 'http://localhost:3001';
    };

    const fetchPosts = async () => {
      const apiBaseUrl = await getApiBaseUrl();
      const endpoint = searchTerm ? `/api/posts/search?q=${encodeURIComponent(searchTerm)}` : '/api/posts';
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`);
      const data = await response.json();
      const sortedPosts = [...data].sort((a, b) => b.timestamp - a.timestamp);
      setPosts(sortedPosts);
    };

    fetchPosts();
  }, [searchTerm]);

  const formatTimestamp = (timestamp: number) => {
    return moment(timestamp*1000).fromNow();
  };

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

export default function Posts() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsContent />
    </Suspense>
  );
}