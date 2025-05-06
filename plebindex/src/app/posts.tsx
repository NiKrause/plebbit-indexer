// app/Posts.tsx
'use client';

import { useEffect, useState } from 'react';

type Post = {
  id: string;
  title: string;
  content: string;
  subplebbitAddress: string;
  authorAddress: string;
  authorDisplayName: string;
};

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    console.log('API BASE URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    fetch(`${apiBaseUrl}/api/posts`)
      .then(res => res.json())
      .then(setPosts);
  }, []);

  return (
    <div>
      <h2>Search Results</h2>
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