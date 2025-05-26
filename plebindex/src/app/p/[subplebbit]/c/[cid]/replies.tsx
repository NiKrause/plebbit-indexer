import { Suspense } from 'react';
import { fetchPost, fetchReplies } from '../../../../../api/posts';
import { Post, Reply } from '../../../../../types';
import { formatTimestamp } from '../../../../../utils/formatting';
import Pagination from '../../../../../components/Pagination';
import SortOptions from '../../../../../components/SortOptions';
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
      <div className={styles.postContainer}>
        <div className={styles.postMeta}>
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
        
        <div className={styles.postTitle}>
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            {post.title}
          </a>
        </div>
        
        <div className={styles.postContent}>
          {post.content}
        </div>
        
        <div className={styles.postStats}>
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
      <SortOptions 
        currentSort={filters.sort} 
        page={page} 
        postId={postId} 
      />
      
      {/* Reply count */}
      <div className={styles.replyCount}>
        Reply count: {pagination.total}
      </div>
      
      {/* Replies */}
      <div className={styles.repliesContainer}>
        {replies.length > 0 ? (
          replies.map((reply: Reply) => (
            <PostItem 
              key={reply.id} 
              post={reply as Post} // Type assertion since Reply is compatible with Post
              showAsReply={true}
            />
          ))
        ) : (
          <div>No replies found.</div>
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
