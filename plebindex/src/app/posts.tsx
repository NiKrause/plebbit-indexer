// app/Posts.tsx
'use client';

import { useEffect, useState } from 'react';
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

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q');

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const endpoint = searchTerm ? `/api/posts/search?q=${encodeURIComponent(searchTerm)}` : '/api/posts';
    
    fetch(`${apiBaseUrl}${endpoint}`)
      .then(res => res.json())
      .then(data => {
        // Sort posts by timestamp in descending order (latest first)
        const sortedPosts = [...data].sort((a, b) => b.timestamp - a.timestamp);
        setPosts(sortedPosts);
      });
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
                href={`https://seedit.app/#/u/${post.authorAddress}`}
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