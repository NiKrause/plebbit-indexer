import moment from 'moment';

export function formatTimestamp(timestamp: number): string {
  return moment(timestamp * 1000).fromNow();
}
// Helper function to safely truncate text
export function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  return text.length <= maxLength ? text : text.slice(0, maxLength);
}

export function createPostUrl(subplebbitAddress: string, cid: string, searchParams?: URLSearchParams): string {
  const queryString = searchParams?.toString();
  return `/p/${subplebbitAddress}/c/${cid}${queryString ? `?${queryString}` : ''}`;
}

export function createPageUrl(
  pageNum: number,
  options: {
    searchTerm?: string | null;
    sort?: string;
    timeFilter?: string;
    includeReplies?: boolean;
    postId?: string;
    subplebbitAddress?: string;
  }
): string {
  const params = new URLSearchParams();
  
  // Add search query if present
  if (options.searchTerm) {
    params.set('q', options.searchTerm);
  }
  
  // Add page number if not the first page
  if (pageNum > 1) {
    params.set('page', pageNum.toString());
  }
  
  // Add sort if not default
  if (options.sort && options.sort !== 'new') {
    params.set('sort', options.sort);
  }
  
  // Add time filter if not default
  if (options.timeFilter && options.timeFilter !== 'all') {
    params.set('t', options.timeFilter);
  }
  
  // Add include-replies if false (since true is default)
  if (options.includeReplies === false) {
    params.set('include-replies', 'false');
  }
  
  const queryString = params.toString();
  
  if (options.postId && options.subplebbitAddress) {
    return `/p/${options.subplebbitAddress}/c/${options.postId}${queryString ? `?${queryString}` : ''}`;
  }
  
  // If there's a search term, always use /search path
  if (options.searchTerm) {
    return `/search${queryString ? `?${queryString}` : ''}`;
  }
  
  return queryString ? `/?${queryString}` : '/';
}

export function createSortUrl(
  newSort: string,
  options: {
    page?: number;
    postId?: string;
    subplebbitAddress?: string;
  }
): string {
  const params = new URLSearchParams();
  if (newSort !== 'new') {
    params.set('sort', newSort);
  }
  if (options.page && options.page > 1) {
    params.set('page', options.page.toString());
  }
  const queryString = params.toString();
  
  if (options.postId && options.subplebbitAddress) {
    return `/p/${options.subplebbitAddress}/c/${options.postId}${queryString ? `?${queryString}` : ''}`;
  }
  
  return queryString ? `/?${queryString}` : '/';
} 