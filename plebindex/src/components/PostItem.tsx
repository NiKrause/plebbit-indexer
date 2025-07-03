import { Post } from '../types';
import PostStats from './PostStats';
import ReportButton from './ReportButton';
import DownloadRaw from './DownloadRaw';
import TimestampDisplay from './TimeStampDisplay';
import { truncateText } from '../utils/formatting';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const isReply = !post.title && post.parentCid && post.postTitle;
  // Main post (Thread)
  if (!isReply) {
    return (
      <div style={{
        borderBottom: '1px solid #ccc',
        marginBottom: 16,
        paddingBottom: 8,
        background: 'var(--background)',
        borderRadius: 6,
        padding: '12px',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        wordBreak: 'break-word'
      }}>
        {/* Thread title */}
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: 'clamp(16px, 4vw, 18px)', 
          color: '#1976d2', 
          marginBottom: 4,
          wordBreak: 'break-word'
        }}>
          <a
            href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none' }}
          >
            {post.title || truncateText(post.content, 60) || post.postTitle || 'Untitled Post'}
          </a>
        </div>
        {/* Meta info */}
        <div style={{ 
          fontSize: 12, 
          color: '#888', 
          marginBottom: 8, 
          display: 'flex', 
          flexWrap: 'wrap',
          alignItems: 'center', 
          gap: 8 
        }}>
          <span style={{ wordBreak: 'break-all' }}>
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
              {post.authorDisplayName ? 
                <span title={`${post.authorDisplayName} (u/${post.authorAddress})`}>
                  {`${post.authorDisplayName.length > 20 ? post.authorDisplayName.substring(0, 20) + '...' : post.authorDisplayName} (u/${post.authorAddress})`}
                </span>
                : `u/${post.authorAddress}`}
            </a>
            {' | '}
            <TimestampDisplay timestamp={post.timestamp} />
          </span>
          <ReportButton postId={post.id} />
          <DownloadRaw post={post} />
        </div>
        {/* Content */}
        <div style={{ 
          marginBottom: 8,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {post.content}
        </div>
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
            postReplyCount={post.postReplyCount}
          />
        </div>
      </div>
    );
  }

  // Reply
  return (
    <div
      style={{
        borderBottom: '1px solid #ccc',
        marginBottom: 16,
        paddingBottom: 8,
        background: 'var(--background)',
        borderRadius: 6,
        padding: 0,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Quoted original post */}
      <div
        style={{
          marginTop: 16,
          marginRight: 12,
          marginLeft: 0,
          marginBottom: 0,
        background: 'var(--background)',
          borderRadius: 6,
          padding: '12px',
          boxShadow: '0 1px 2px rgba(25, 118, 210, 0.04)',
          width: 'auto'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: 'clamp(14px, 3.5vw, 15px)', 
            color: '#1976d2',
            wordBreak: 'break-word'
          }}>
            <a
              href={`https://seedit.app/#/p/${post.subplebbitAddress}/c/${post.parentCid || post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'none' }}
            >
              {post.postTitle || post.title || 'Untitled Post'}
            </a>
          </span>
          <span style={{ 
            fontSize: 12, 
            color: '#888',
            wordBreak: 'break-all'
          }}>
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
              href={`https://seedit.app/#/u/${post.postAuthorAddress || post.authorAddress}/c/${post.parentCid || post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
            >
              {post.postAuthorDisplayName || post.authorDisplayName
                ? `${(post.postAuthorDisplayName || post.authorDisplayName).substring(0, 20)} (u/${post.postAuthorAddress || post.authorAddress})`
                : `u/${post.postAuthorAddress || post.authorAddress}`}
            </a>
            {' | '}
            <TimestampDisplay timestamp={post.postTimestamp} />
          </span>
        </div>
      </div>
      {/* Reply content with blue vertical line */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        margin: '12px 16px 12px',
        width: 'auto'
      }}>
        {/* Blue vertical line */}
        <div
          style={{
            width: 4,
            background: '#1976d2',
            borderRadius: 4,
            marginRight: 12,
            marginTop: -8,
            marginBottom: -8,
            minHeight: 'calc(100% + 16px)',
          }}
        />
        {/* Reply meta and content */}
        <div style={{ 
          flex: 1, 
          paddingTop: 8,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {/* Meta info for reply */}
          <div style={{ 
            fontSize: 12, 
            color: '#888', 
            display: 'flex', 
            flexWrap: 'wrap',
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 4 
          }}>
            <span style={{ wordBreak: 'break-all' }}>
              {/* <a
                href={`https://seedit.app/#/p/${post.subplebbitAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
              >
                {post.subplebbitAddress}
              </a>
              {' | '} */}
              by{' '}
              <a
                href={`https://seedit.app/#/u/${post.authorAddress}/c/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#888', textDecoration: 'underline', fontWeight: 500 }}
              >
                {post.authorDisplayName
                  ? `${post.authorDisplayName.substring(0, 20)} (u/${post.authorAddress})`
                  : `u/${post.authorAddress}`}
              </a>
              {' | '}
              <TimestampDisplay timestamp={post.timestamp} />
            </span>
            <ReportButton postId={post.id} />
            <DownloadRaw post={post} />
          </div>
          {/* Reply content */}
          <div style={{ 
            marginBottom: 8,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {post.content}
          </div>
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
              postReplyCount={post.postReplyCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 