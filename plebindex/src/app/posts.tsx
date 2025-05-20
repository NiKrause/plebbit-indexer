// app/Posts.tsx

import { Suspense } from 'react';
import moment from 'moment';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  subplebbitAddress: string;
  authorAddress: string;
  authorDisplayName: string;
  timestamp: number;
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
}

interface PaginatedResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    sort: string;
    timeFilter: string;
  };
}

async function fetchPosts(
  searchTerm?: string | null, 
  page: number = 1, 
  limit: number = 0,
  sort: string = 'new',
  timeFilter: string = 'all'
) {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl && process.env.NODE_ENV === 'development') {
    apiBaseUrl = 'http://crawler:3001';
  } else if (!apiBaseUrl) {
    apiBaseUrl = '';  
  }
  
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
        timeFilter: rawData.filters?.timeFilter || 'all'
      }
    };
    
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Return mock data in development for testing
    if (process.env.NODE_ENV === 'development') {
      const mockPosts = getMockPosts();
      return {
        posts: mockPosts,
        pagination: {
          total: mockPosts.length,
          page: 1,
          limit: 20,
          pages: 1
        },
        filters: {
          sort,
          timeFilter
        }
      };
    }
    return { 
      posts: [], 
      pagination: { total: 0, page: 1, limit: 20, pages: 0 },
      filters: { sort, timeFilter }
    };
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
      timestamp: Math.floor(Date.now() / 1000) - 3600,
      upvoteCount: 15,
      downvoteCount: 3,
      replyCount: 7
    },
    {
      id: 'mock2',
      title: 'Mock Post 2',
      content: 'Another mock post for development.',
      subplebbitAddress: 'mock',
      authorAddress: 'mockuser2',
      authorDisplayName: 'Developer',
      timestamp: Math.floor(Date.now() / 1000) - 7200,
      upvoteCount: 8,
      downvoteCount: 1,
      replyCount: 2
    }
  ];
}

function formatTimestamp(timestamp: number) {
  return moment(timestamp*1000).fromNow();
}

// Component for pagination controls
function Pagination({ 
  pagination, 
  searchTerm,
  sort,
  timeFilter 
}: { 
  pagination: PaginatedResponse['pagination'], 
  searchTerm?: string | null,
  sort: string, 
  timeFilter: string 
}) {
  const { page, pages } = pagination;
  
  // Generate array of page numbers to display
  const pageNumbers = [];
  const maxPageButtons = 5;
  
  let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  const endPage = Math.min(pages, startPage + maxPageButtons - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  // Create base URL with all parameters
  const createPageUrl = (pageNum: number) => {
    // Start with the base params
    const params = new URLSearchParams();
    
    // Add search query if present
    if (searchTerm) {
      params.set('q', searchTerm);
    }
    
    // Add page number if not the first page
    if (pageNum > 1) {
      params.set('page', pageNum.toString());
    }
    
    // Add sort if not default
    if (sort !== 'new') {
      params.set('sort', sort);
    }
    
    // Add time filter if not default
    if (timeFilter !== 'all') {
      params.set('t', timeFilter);
    }
    
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };
  
  // Simple pagination styles
  const paginationStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      margin: '20px 0',
      gap: '8px'
    },
    pageLink: {
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      textDecoration: 'none',
      color: '#374151'
    },
    activePage: {
      backgroundColor: '#4b5563',
      color: 'white',
      borderColor: '#4b5563'
    },
    disabledLink: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  };
  
  return (
    <div style={paginationStyles.container}>
      {/* Previous Page */}
      {page > 1 ? (
        <Link 
          href={createPageUrl(page - 1)}
          style={paginationStyles.pageLink}
        >
          &laquo; Prev
        </Link>
      ) : (
        <span style={{...paginationStyles.pageLink, ...paginationStyles.disabledLink}}>
          &laquo; Prev
        </span>
      )}
      
      {/* Page Numbers */}
      {pageNumbers.map(num => (
        <Link
          key={num}
          href={createPageUrl(num)}
          style={{
            ...paginationStyles.pageLink,
            ...(num === page ? paginationStyles.activePage : {})
          }}
        >
          {num}
        </Link>
      ))}
      
      {/* Next Page */}
      {page < pages ? (
        <Link 
          href={createPageUrl(page + 1)}
          style={paginationStyles.pageLink}
        >
          Next &raquo;
        </Link>
      ) : (
        <span style={{...paginationStyles.pageLink, ...paginationStyles.disabledLink}}>
          Next &raquo;
        </span>
      )}
    </div>
  );
}

async function PostsContent({ 
  searchTerm, 
  page = 1, 
  sort = 'new', 
  timeFilter = 'all' 
}: { 
  searchTerm?: string | null, 
  page?: number,
  sort?: string,
  timeFilter?: string 
}) {
  const { posts, pagination, filters } = await fetchPosts(searchTerm, page, 0, sort, timeFilter);
  
  return (
    <div>
      <h2>{searchTerm ? `Search Results for "${searchTerm}"` : 'All Posts'}</h2>
      
      {/* Display current filters */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <span>Sorted by: <strong>{filters.sort}</strong></span>
        {filters.timeFilter !== 'all' && (
          <span> • Time: <strong>{filters.timeFilter}</strong></span>
        )}
      </div>
      
      <div>
        {posts.length > 0 ? (
          posts.map(post => (
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
                <span title={new Date(post.timestamp * 1000).toLocaleString()}>
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
              
              {/* Post stats - upvotes, downvotes, replies */}
              <div style={{ marginTop: 8, fontSize: 12, color: '#888', display: 'flex', gap: '12px' }}>
                <span title="Upvotes">
                  <span style={{ color: '#4F9956' }}>▲</span> {post.upvoteCount || 0}
                </span>
                <span title="Downvotes">
                  <span style={{ color: '#E25241' }}>▼</span> {post.downvoteCount || 0}
                </span>
                <span title="Replies">
                  <span>💬</span> {post.replyCount || 0} {post.replyCount === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div>No posts found.</div>
        )}
      </div>
      
      {pagination.pages > 1 && (
        <Pagination 
          pagination={pagination} 
          searchTerm={searchTerm} 
          sort={filters.sort} 
          timeFilter={filters.timeFilter} 
        />
      )}
    </div>
  );
}

export default async function Posts({ searchParams }: { 
  searchParams?: { 
    q?: string, 
    page?: string,
    sort?: string,
    t?: string
  } 
}) {
  // Get parameters from URL query
  const searchTerm = searchParams?.q || null;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'new';
  const timeFilter = searchParams?.t || 'all';
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsContent 
        searchTerm={searchTerm} 
        page={page} 
        sort={sort} 
        timeFilter={timeFilter} 
      />
    </Suspense>
  );
}