import { Suspense } from 'react';
import moment from 'moment';
import Link from 'next/link';

interface Reply {
  id: string;
  title?: string;
  content: string;
  subplebbitAddress: string;
  authorAddress: string;
  authorDisplayName: string;
  timestamp: number;
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  parentCid: string;
  postCid: string;
}

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

interface PaginatedRepliesResponse {
  replies: Reply[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    sort: string;
  };
}

async function fetchPost(postId: string) {
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl && process.env.NODE_ENV === 'development') {
    apiBaseUrl = 'http://crawler:3001';
  } else if (!apiBaseUrl) {
    apiBaseUrl = '';  
  }
  
  const url = `${apiBaseUrl}/api/posts/${postId}`;
  
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

async function fetchReplies(
  postId: string, 
  page: number = 1, 
  limit: number = 20,
  sort: string = 'new'
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
  
  const url = `${apiBaseUrl}/api/replies/${postId}?${params.toString()}`;
  
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
    console.error('Error fetching replies:', error);
    return { 
      replies: [], 
      pagination: { total: 0, page: 1, limit: 20, pages: 0 },
      filters: { sort }
    };
  }
}

function formatTimestamp(timestamp: number) {
  return moment(timestamp*1000).fromNow();
}

function ReplyPagination({ 
  pagination, 
  postId,
  sort
}: { 
  pagination: PaginatedRepliesResponse['pagination'], 
  postId: string,
  sort: string
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
    
    // Add page number if not the first page
    if (pageNum > 1) {
      params.set('page', pageNum.toString());
    }
    
    // Add sort if not default
    if (sort !== 'new') {
      params.set('sort', sort);
    }
    
    const queryString = params.toString();
    return `/post/${postId}${queryString ? `?${queryString}` : ''}`;
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
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d1d5db',
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

async function RepliesContent({ 
  postId, 
  post,
  page = 1, 
  sort = 'new'
}: { 
  postId: string,
  post: Post | null,
  page?: number,
  sort?: string
}) {
  const { replies, pagination, filters } = await fetchReplies(postId, page, 20, sort);
  
  if (!post) {
    return <div>Post not found or error loading post</div>;
  }

  // Styles for post and replies
  const styles = {
    postContainer: {
      borderBottom: '2px solid #eaeaea',
      marginBottom: '20px',
      paddingBottom: '20px'
    },
    postTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '8px'
    },
    postMeta: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '12px'
    },
    postContent: {
      marginBottom: '16px'
    },
    postStats: {
      display: 'flex',
      gap: '12px',
      fontSize: '14px',
      color: '#666'
    },
    sortOptions: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      alignItems: 'center'
    },
    sortButton: {
      padding: '4px 8px',
      fontSize: '14px',
      borderRadius: '4px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      background: 'white',
      cursor: 'pointer'
    },
    sortButtonActive: {
      background: '#4b5563',
      color: 'white',
      borderColor: '#4b5563'
    },
    replyCount: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '16px'
    },
    repliesContainer: {
      marginTop: '20px'
    },
    replyItem: {
      borderBottom: '1px solid #eaeaea',
      paddingBottom: '16px',
      marginBottom: '16px'
    },
    replyMeta: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '8px'
    },
    replyContent: {
      marginBottom: '8px'
    },
    replyStats: {
      display: 'flex',
      gap: '12px',
      fontSize: '14px',
      color: '#666'
    }
  };

  // Function to create sort URL
  const createSortUrl = (newSort: string) => {
    const params = new URLSearchParams();
    if (newSort !== 'new') {
      params.set('sort', newSort);
    }
    if (page > 1) {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return `/post/${postId}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div>
      {/* Original Post */}
      <div style={styles.postContainer}>
        <div style={styles.postMeta}>
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A5568', fontWeight: 'bold', textDecoration: 'none' }}
          >
            r/{post.subplebbitAddress}
          </a>
          {' • Posted by '}
          <a
            href={`https://seedit.app/#/u/${post.authorAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4A5568', textDecoration: 'none' }}
          >
            {post.authorDisplayName || post.authorAddress}
          </a>
          {' • '}
          <span title={new Date(post.timestamp * 1000).toLocaleString()}>
            {formatTimestamp(post.timestamp)}
          </span>
        </div>
        
        <div style={styles.postTitle}>
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {post.title}
          </a>
        </div>
        
        <div style={styles.postContent}>
          {post.content}
        </div>
        
        <div style={styles.postStats}>
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
      
      {/* Sort options for replies */}
      <div style={styles.sortOptions}>
        <span>Sort by:</span>
        {['new', 'old', 'top'].map(sortOption => (
          <Link
            key={sortOption}
            href={createSortUrl(sortOption)}
            style={{
              ...styles.sortButton,
              ...(filters.sort === sortOption ? styles.sortButtonActive : {})
            }}
          >
            {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
          </Link>
        ))}
      </div>
      
      {/* Reply count */}
      <div style={styles.replyCount}>
        {pagination.total} {pagination.total === 1 ? 'Reply' : 'Replies'}
      </div>
      
      {/* Replies */}
      <div style={styles.repliesContainer}>
        {replies.length > 0 ? (
          replies.map((reply: Reply) => (
            <div key={reply.id} style={styles.replyItem}>
              <div style={styles.replyMeta}>
                <a
                  href={`https://seedit.app/#/u/${reply.authorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4A5568', fontWeight: 'bold', textDecoration: 'none' }}
                >
                  {reply.authorDisplayName || reply.authorAddress}
                </a>
                {' • '}
                <span title={new Date(reply.timestamp * 1000).toLocaleString()}>
                  {formatTimestamp(reply.timestamp)}
                </span>
              </div>
              
              {reply.title && (
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {reply.title}
                </div>
              )}
              
              <div style={styles.replyContent}>
                {reply.content}
              </div>
              
              <div style={styles.replyStats}>
                <span title="Upvotes">
                  <span style={{ color: '#4F9956' }}>▲</span> {reply.upvoteCount || 0}
                </span>
                <span title="Downvotes">
                  <span style={{ color: '#E25241' }}>▼</span> {reply.downvoteCount || 0}
                </span>
                {reply.replyCount > 0 && (
                  <Link
                    href={`/post/${reply.id}`}
                    style={{ color: '#4A5568', textDecoration: 'none' }}
                  >
                    <span>💬</span> {reply.replyCount} {reply.replyCount === 1 ? 'reply' : 'replies'}
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>No replies found.</div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <ReplyPagination 
          pagination={pagination} 
          postId={postId} 
          sort={filters.sort} 
        />
      )}
    </div>
  );
}

export default async function Replies({ 
  postId, 
  searchParams 
}: { 
  postId: string, 
  searchParams?: { 
    page?: string,
    sort?: string
  } 
}) {
  // Get parameters from URL query
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'new';
  
  // Fetch the post details
  const post = await fetchPost(postId);
  
  return (
    <Suspense fallback={<div>Loading replies...</div>}>
      <RepliesContent 
        postId={postId}
        post={post}
        page={page} 
        sort={sort}
      />
    </Suspense>
  );
}
