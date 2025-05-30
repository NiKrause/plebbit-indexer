import { Post } from '../types';
import PostStats from './PostStats';
import ReportButton from './ReportButton';
import TimestampDisplay from './TimeStampDisplay';
// import Link from 'next/link';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const isReply = !post.title && post.parentCid && post.parentTitle;
  // Main post (Thread)
  if (!isReply) {
    return (
      <div style={{
        borderBottom: '1px solid #ccc',
        marginBottom: 16,
        paddingBottom: 8,
        background: '#f8f9fa',
        borderRadius: 6,
        padding: 16,
      }}>
        {/* Thread title */}
        <div style={{ fontWeight: 'bold', fontSize: 18, color: '#1976d2', marginBottom: 4 }}>
          {' '}
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            {post.title || post.parentTitle}
          </a>
        </div>
        {/* Meta info */}
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>
            <a
              href={`https://seedit.app/#/p/${post.subplebbitAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
            >
              {post.subplebbitAddress}
            </a>
            {' | '}by{' '}
            <a
              href={`https://seedit.app/#/u/${post.authorAddress}/c/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
            >
              {post.authorDisplayName || post.authorAddress}
            </a>
            {' | '}
            <TimestampDisplay timestamp={post.timestamp} />
            {' | '}
            {post.parentReplyCount || post.replyCount} posts 
          </span>
          <ReportButton postId={post.id} />
        </div>
        {/* Content */}
        <div style={{ marginBottom: 8 }}>{post.content}</div>
        {/* Post stats and report */}
        <div style={{ marginTop: 8 }}>
          <PostStats
            upvoteCount={post.upvoteCount}
            downvoteCount={post.downvoteCount}
            replyCount={post.replyCount}
            postId={post.id}
            subplebbitAddress={post.subplebbitAddress}
            isReply={false}
            postCid={post.postCid}
            parentCid={post.parentCid}
            parentReplyCount={post.parentReplyCount}
          />
        </div>
      </div>
    );
  }

  // Reply
  return (
    <div style={{
      borderBottom: '1px solid #ccc',
      marginBottom: 16,
      paddingBottom: 8,
      // marginLeft: 40,
      borderLeft: '4px solid #b3d4fc',
      background: '#f7fbff',
      borderRadius: 6,
      padding: 16,
    }}>
      {/* Thread title (repeated for reply) */}
      <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2', marginBottom: 2 }}>
        {' '}
        <a
          href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'none' }}
        >
          {post.parentTitle || post.title}
        </a>
      </div>
      {/* Meta info for reply */}
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
          >
            {post.subplebbitAddress}
          </a>
          {' | '}by{' '}
          <a
            href={`https://seedit.app/#/u/${post.authorAddress}/c/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
          >
            {post.authorDisplayName || post.authorAddress}
          </a>
          {' | '}
          <TimestampDisplay timestamp={post.timestamp} />
        </span>
        <ReportButton postId={post.id} />
      </div>
      {/* Content */}
      <div style={{ marginBottom: 8 }}>{post.content}</div>
      {/* Post stats and report */}
      <div style={{ marginTop: 8 }}>
        <PostStats
          upvoteCount={post.upvoteCount}
          downvoteCount={post.downvoteCount}
          replyCount={post.replyCount}
          postId={post.id}
          subplebbitAddress={post.subplebbitAddress}
          isReply={true}
          postCid={post.postCid}
          parentCid={post.parentCid}
          parentReplyCount={post.parentReplyCount}
        />
      </div>
    </div>
  );
} 