import Link from 'next/link';

interface PostStatsProps {
  upvoteCount: number;
  downvoteCount: number;
  replyCount: number;
  postId: string;
  subplebbitAddress: string;
  isReply?: boolean;
  postCid?: string;
  parentCid?: string;
  postReplyCount?: number;
}

export default function PostStats({ 
  upvoteCount, 
  downvoteCount, 
  replyCount, 
  postId,
  subplebbitAddress,
  postCid,
  parentCid,
  postReplyCount 
}: PostStatsProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666' }}>
      <span title="Upvotes">
        <span style={{ color: '#4F9956' }}>▲</span> {upvoteCount || 0}
      </span>
      <span title="Downvotes">
        <span style={{ color: '#E25241' }}>▼</span> {downvoteCount || 0}
      </span>
      
      <Link 
        href={`/p/${subplebbitAddress}/c/${postId}`}
        title="View replies to this comment" 
        style={{ color: '#888', textDecoration: 'none' }}
      >
        <span>💬</span> {replyCount || 0} {replyCount === 1 ? 'reply' : 'replies'}
      </Link>

      <Link 
        href={`/p/${subplebbitAddress}/c/${postCid || parentCid}`}
        title="View original post" 
        style={{ color: '#888', textDecoration: 'none' }}
      >
        <span>📝</span> all comments ({postReplyCount || replyCount || 0})
      </Link>
    </div>
  );
} 