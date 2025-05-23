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
  parentTitle?: string;
  parentAuthorDisplayName?: string;
  parentAuthorAddress?: string;
}

export interface Reply {
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
  parentCid: string;
  postCid: string;
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
  replies: Reply[];
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
