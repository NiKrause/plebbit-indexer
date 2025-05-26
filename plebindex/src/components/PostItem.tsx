import Link from 'next/link';
import { Post } from '../types';
import { formatTimestamp } from '../utils/formatting';
import PostStats from './PostStats';

interface PostItemProps {
  post: Post;
  showAsReply?: boolean;
}

export default function PostItem({ post, showAsReply = false }: PostItemProps) {
  return (
    <div style={{ 
      borderBottom: '1px solid #ccc', 
      marginBottom: 16, 
      paddingBottom: 8,
      marginLeft: showAsReply ? 20 : 0, // Indent replies
      borderLeft: showAsReply ? '3px solid #ddd' : 'none' // Visual indicator for replies
    }}>
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
        {' • '}
        <Link
          href={`/report/${post.id}`}
          style={{
            color: '#888',
            textDecoration: 'underline',
            fontSize: 12
          }}
        >
          report
        </Link>
        
        {/* Show parent post context for replies */}
        <br/>
        {!post.title && post.parentCid && post.parentTitle && (
          <>
            <Link 
              href={`/p/${post.subplebbitAddress}/c/${post.postCid || post.parentCid}`}
              style={{ color: '#888', textDecoration: 'underline' }}
            >
              &quot;{post.parentTitle}&quot;
            </Link>
            {(post.parentAuthorDisplayName || post.parentAuthorAddress) && (
              <span> by {post.parentAuthorDisplayName || post.parentAuthorAddress}</span>
            )}
          </>
        )}
      </div>
      
      {/* Conditional rendering based on whether it's a reply or post */}
      {post.title ? (
        <a
          href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 'bold', fontSize: 18 }}
        >
          {post.title}
        </a>
      ) : (
        // Show parent title for replies in the same style as post titles
        post.parentCid && post.parentTitle && (
          <Link 
            href={`/p/${post.subplebbitAddress}/c/${post.postCid || post.parentCid}`}
            style={{ fontWeight: 'bold', fontSize: 18, textDecoration: 'none' }}
          >
            {post.parentTitle}
          </Link>
        )
      )}
      
      <div style={{ marginTop: 4 }}>{post.content}</div>
      
      <div style={{ marginTop: 8 }}>
        <PostStats
          upvoteCount={post.upvoteCount}
          downvoteCount={post.downvoteCount}
          replyCount={post.replyCount}
          postId={post.id}
          subplebbitAddress={post.subplebbitAddress}
          isReply={!post.title}
          postCid={post.postCid}
          parentCid={post.parentCid}
        />
      </div>
    </div>
  );
} 