// import { Suspense } from 'react';
import { fetchReplies } from '../../../../../api/posts';
import { Post } from '../../../../../types';
import Pagination from '../../../../../components/Pagination';
import styles from '../../../../../styles/shared.module.css';
import PostItem from '../../../../../components/PostItem';

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
  const { replies, pagination, filters } = await fetchReplies(postId, page, 25, sort);
  
  if (!post) {
    return <div>Post not found or error loading post</div>;
  }

  return (
    <div>
      {/* Original Post */}
      <PostItem post={post} />
      
      {/* Reply count as a heading */}
      <h1 style={{ 
        fontSize: 20, 
        fontWeight: 600, 
        margin: '24px 0 12px 0',
        padding: '0 16px',
        color: 'var(--foreground)'
      }}>
        {pagination.total} direct {pagination.total === 1 ? 'reply' : 'replies'}
      </h1> 
      
      {/* Replies */}
      <div className={styles.repliesContainer}>
        {replies.length > 0 ? (
          replies.map((reply: Post) => (
            <PostItem 
              key={reply.id} 
              post={reply as Post}
            />
          ))
        ) : (
          <div style={{ 
            maxWidth: 700, 
            width: '100%', 
            textAlign: 'left', 
            color: 'var(--foreground)', 
            padding: '16px 16px'
          }}>
            No replies found.
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination 
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
  post,
  searchParams 
}: { 
  postId: string,
  post: Post | null,
  searchParams?: { 
    page?: string,
    sort?: string
  } 
}) {
  // Get parameters from URL query
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'new';
  
  return (
    // <Suspense fallback={<div>Loading replies...</div>}>
      <RepliesContent 
        postId={postId}
        post={post}
        page={page} 
        sort={sort}
      />
    // </Suspense>
  );
}
