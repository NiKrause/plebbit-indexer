import Link from 'next/link';
import { createSortUrl } from '../utils/formatting';
import styles from '../styles/shared.module.css';

interface SortOptionsProps {
  currentSort: string;
  page?: number;
  postId?: string;
  options?: string[];
}

export default function SortOptions({ 
  currentSort, 
  page, 
  postId, 
  options = ['new', 'old', 'top'] 
}: SortOptionsProps) {
  return (
    <div className={styles.sortOptions}>
      <span>Sort by:</span>
      {options.map(sortOption => (
        <Link
          key={sortOption}
          href={createSortUrl(sortOption, { page, postId })}
          className={`${styles.sortButton} ${currentSort === sortOption ? styles.sortButtonActive : ''}`}
        >
          {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
        </Link>
      ))}
    </div>
  );
} 