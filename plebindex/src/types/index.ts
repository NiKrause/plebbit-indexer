export interface Post {
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
  parentCid?: string;  // Add for replies
  postCid?: string;    // Add for replies
  // New fields from JOIN
  postTitle?: string;
  postAuthorDisplayName?: string;
  postAuthorAddress?: string;
  postReplyCount?: number; 
  postTimestamp: number;
}

export interface PaginatedResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    sort: string;
    timeFilter: string;
    includeReplies: boolean;
  };
}

export interface PaginatedRepliesResponse {
  replies: Post[];
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

export interface PaginationProps {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  searchTerm?: string | null;
  sort: string;
  timeFilter?: string;
  includeReplies?: boolean;
  postId?: string;
}

// Admin types
export interface FlaggedPost {
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
  parentCid?: string;
  postCid?: string;
  reason: string;
  status: 'pending' | 'ignored' | 'deindexed_comment' | 'deindexed_author' | 'deindexed_subplebbit';  // Update this line
  flagged_at: string;
  postTitle?: string;
  postAuthorDisplayName?: string;
  postAuthorAddress?: string;
  postTimestamp?: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  moderated: number;
  stats: {
    reason: string;
    count: number;
  }[];
}

export interface ModerationAction {
  action: 'ignore' | 'deindex_comment' | 'deindex_author' | 'deindex_subplebbit';
}
