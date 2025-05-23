import Link from 'next/link';

interface PostStatsProps {
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  postId: string;
  isReply?: boolean;
  postCid?: string;
  parentCid?: string;
}

export default function PostStats({ 
  upvoteCount, 
  downvoteCount, 
  replyCount, 
  postId,
  isReply = false,
  postCid,
  parentCid 
}: PostStatsProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666' }}>
      <span title="Upvotes">
        <span style={{ color: '#4F9956' }}>▲</span> {upvoteCount || 0}
      </span>
      <span title="Downvotes">
        <span style={{ color: '#E25241' }}>▼</span> {downvoteCount || 0}
      </span>
      
      {isReply ? (
        <>
          <Link 
            href={`/post/${postCid || parentCid}`}
            title="View original post" 
            style={{ color: '#888', textDecoration: 'none' }}
          >
            <span>📝</span> 
          </Link>
          {replyCount > 0 && (
            <Link 
              href={`/post/${postId}`}
              title="View replies to this comment" 
              style={{ color: '#888', textDecoration: 'none' }}
            >
              <span>💬</span> {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </Link>
          )}
        </>
      ) : (
        <>
          <Link 
            href={`/post/${postId}`}
            title="View Replies" 
            style={{ color: '#888', textDecoration: 'none' }}
          >
            <span>💬</span> Reply count: {replyCount || 0}
          </Link>
        </>
      )}
    </div>
  );
} 