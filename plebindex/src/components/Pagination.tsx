import Link from 'next/link';
import { PaginationProps } from '../types';
import { createPageUrl } from '../utils/formatting';
import styles from '../styles/shared.module.css';

export default function Pagination({ 
  pagination, 
  searchTerm,
  sort,
  timeFilter,
  includeReplies,
  postId
}: PaginationProps) {
  const { page, pages } = pagination;
  
  // Generate array of page numbers to display
  const pageNumbers = [];
  const maxPageButtons = 5;
  
  let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  const endPage = Math.min(pages, startPage + maxPageButtons - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  const createUrl = (pageNum: number) => createPageUrl(pageNum, {
    searchTerm,
    sort,
    timeFilter,
    includeReplies,
    postId
  });
  
  return (
    <div className={styles.container}>
      {/* Previous Page */}
      {page > 1 ? (
        <Link 
          href={createUrl(page - 1)}
          className={styles.pageLink}
        >
          &laquo; Prev
        </Link>
      ) : (
        <span className={`${styles.pageLink} ${styles.disabledLink}`}>
          &laquo; Prev
        </span>
      )}
      
      {/* Page Numbers */}
      {pageNumbers.map(num => (
        <Link
          key={num}
          href={createUrl(num)}
          className={`${styles.pageLink} ${num === page ? styles.activePage : ''}`}
        >
          {num}
        </Link>
      ))}
      
      {/* Next Page */}
      {page < pages ? (
        <Link 
          href={createUrl(page + 1)}
          className={styles.pageLink}
        >
          Next &raquo;
        </Link>
      ) : (
        <span className={`${styles.pageLink} ${styles.disabledLink}`}>
          Next &raquo;
        </span>
      )}
    </div>
  );
} 