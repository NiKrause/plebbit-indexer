// app/Posts.tsx

import { Suspense } from 'react';
import { fetchPosts } from '../api/posts';
import { Post, PaginatedResponse } from '../types';
import PostItem from '../components/PostItem';
import Pagination from '../components/Pagination';

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

async function PostsContent({ 
  searchTerm, 
  page = 1, 
  sort = 'new', 
  timeFilter = 'all',
  includeReplies = true 
}: { 
  searchTerm?: string | null, 
  page?: number,
  sort?: string,
  timeFilter?: string,
  includeReplies?: boolean 
}) {
  let result: PaginatedResponse;
  
  try {
    result = await fetchPosts(searchTerm, page, 25, sort, timeFilter, includeReplies);
  } catch (error) {
    console.error('Error in PostsContent:', error);
    // Provide fallback data
    const mockPosts = getMockPosts();
    result = {
      posts: mockPosts,
      pagination: {
        total: mockPosts.length,
        page: 1,
        limit: 25,
        pages: 1
      },
      filters: {
        sort,
        timeFilter,
        includeReplies
      }
    };
  }
  
  const { posts, pagination, filters } = result;
  
  return (
    <div>
      <h2>{searchTerm ? `Search Results for "${searchTerm}"` : 'All Posts'}</h2>
      
      {/* Display current filters */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <span>Sorted by: <strong>{filters.sort}</strong></span>
        {filters.timeFilter !== 'all' && (
          <span> • Time: <strong>{filters.timeFilter}</strong></span>
        )}
        <span> • Include replies: <strong>{filters.includeReplies ? 'Yes' : 'No'}</strong></span>
      </div>
      
      <div>
        {posts.length > 0 ? (
          posts.map(post => (
            <PostItem key={post.id} post={post} />
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
          includeReplies={filters.includeReplies} 
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
    t?: string,
    'include-replies'?: string
  } 
}) {
  // Get parameters from URL query
  const searchTerm = searchParams?.q || null;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'new';
  const timeFilter = searchParams?.t || 'all';
  const includeReplies = searchParams?.['include-replies'] !== 'false'; // defaults to true
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsContent 
        searchTerm={searchTerm} 
        page={page} 
        sort={sort} 
        timeFilter={timeFilter} 
        includeReplies={includeReplies}
      />
    </Suspense>
  );
}