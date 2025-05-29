import { Post } from '../types';
import { formatTimestamp } from '../utils/formatting';
import PostStats from './PostStats';
import ReportButton from './ReportButton';
// import Link from 'next/link';

interface PostItemProps {
  post: Post;
  showAsReply?: boolean;
}

export default function PostItem({ post, showAsReply = false }: PostItemProps) {
  const isReply = !post.title && post.parentCid && post.parentTitle;

  return (
    <div
      style={{
        borderBottom: '1px solid #ccc',
        marginBottom: 16,
        paddingBottom: 8,
        marginLeft: showAsReply ? 40 : 0,
        borderLeft: showAsReply ? '4px solid #b3d4fc' : 'none',
        background: showAsReply ? '#f7fbff' : 'none',
        borderRadius: showAsReply ? 6 : 0,
        paddingTop: showAsReply ? 8 : 0,
        paddingRight: 8,
        paddingLeft: showAsReply ? 12 : 0,
      }}
    >
      <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
        {isReply && (
          <span
            style={{
              background: '#e3f2fd',
              color: '#1976d2',
              fontWeight: 600,
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              marginRight: 8,
              letterSpacing: 0.5,
            }}
          >
            Reply
          </span>
        )}
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
          style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
        >
          {post.authorDisplayName || post.authorAddress}
        </a>
        {' • '}
        <span title={new Date(post.timestamp * 1000).toLocaleString()}>
          {formatTimestamp(post.timestamp)}
        </span>
        {' • '}
        <span>
          Reply count {post.parentReplyCount} 
        </span>
        {' • '}
        <ReportButton postId={post.id} />
      </div>

      {/* Show parent post context for replies */}
      {isReply && (
        <div style={{ fontSize: 12, color: '#1976d2', marginBottom: 4 }}>
          {/* In reply to:{' '} */}
          <a
          href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.postCid || post.parentCid}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 'bold', fontSize: 18 }}
        >
          {post.parentTitle}
        </a>
          {/* <Link
            href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.postCid || post.parentCid}`}
            style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}
          >
            &quot;{post.parentTitle}&quot;
          </Link> */}
          {(post.parentAuthorDisplayName || post.parentAuthorAddress) && (
            // <span>
            //   {' '}
            //   by{' '}
            //   <span style={{ fontWeight: 500 }}>
            //     {post.parentAuthorDisplayName || post.parentAuthorAddress}
            //   </span>
            // </span>
            <span> by{' '} 
            <a
            href={`https://seedit.app/#/u/${post.parentAuthorAddress}/c/${post.postCid || post.parentCid}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
          >
            {post.parentAuthorDisplayName || post.parentAuthorAddress}
          </a>
          </span>
          )}
        </div>
      )}

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
        post.parentCid &&
        post.parentTitle && (
          <a
          href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 'bold', fontSize: 18 }}
        >
          {post.title}
        </a>
          // <Link
          //   href={`/p/${post.subplebbitAddress}/c/${post.postCid || post.parentCid}`}
          //   style={{ fontWeight: 'bold', fontSize: 18, textDecoration: 'none' }}
          // >
          //   {post.parentTitle}
          // </Link>
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