'use client';

import { useState, useEffect } from 'react';
import { SubplebbitStats, SubplebbitsResponse } from '../types';

// Format timestamp to human readable date
function formatAge(timestamp: number): string {
  const now = Date.now() / 1000;
  const ageInSeconds = now - timestamp;
  const ageInDays = Math.floor(ageInSeconds / (60 * 60 * 24));
  
  if (ageInDays < 30) {
    return `${ageInDays} days`;
  } else if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(ageInDays / 365);
    const remainingMonths = Math.floor((ageInDays % 365) / 30);
    return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
  }
}

type SortField = 'address' | 'title' | 'cph' | 'totalPosts' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SubplebbitsTableProps {
  initialData: SubplebbitsResponse | null;
}

export default function SubplebbitsTable({ initialData }: SubplebbitsTableProps) {
  const [subplebbits, setSubplebbits] = useState<SubplebbitStats[]>([]);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subplebbitsSortField');
      return (saved as SortField) || 'cph'; // Default to 'cph' if nothing saved
    }
    return 'cph';
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('subplebbitsSortDirection');
      return (saved as SortDirection) || 'desc'; // Default to 'desc' if nothing saved
    }
    return 'desc';
  });

  // Initialize data from server-side props
  useEffect(() => {
    if (initialData) {
      setSubplebbits(initialData.subplebbits);
    } else {
      setError('Failed to load subplebbit data');
    }
  }, [initialData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('subplebbitsSortDirection', newDirection);
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('subplebbitsSortField', field);
        localStorage.setItem('subplebbitsSortDirection', 'desc');
      }
    }
  };

  const sortedSubplebbits = [...subplebbits].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'address':
      case 'title':
        aValue = a[sortField].toLowerCase();
        bValue = b[sortField].toLowerCase();
        break;
      case 'cph':
      case 'totalPosts':
      case 'createdAt':
        aValue = a[sortField];
        bValue = b[sortField];
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (error) {
    return (
      <div className="text-center">
        <div style={{ padding: '40px', color: '#dc2626' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'var(--background)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        color: 'var(--foreground)'
      }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--imprint-section-bg)' }}>
            <th
              onClick={() => handleSort('address')}
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid var(--imprint-border)',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Subplebbit Address {getSortIcon('address')}
            </th>
            <th
              onClick={() => handleSort('title')}
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid var(--imprint-border)',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Title {getSortIcon('title')}
            </th>
            <th
              onClick={() => handleSort('cph')}
              style={{
                padding: '12px',
                textAlign: 'right',
                borderBottom: '2px solid var(--imprint-border)',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              CPH {getSortIcon('cph')}
            </th>
            <th
              onClick={() => handleSort('totalPosts')}
              style={{
                padding: '12px',
                textAlign: 'right',
                borderBottom: '2px solid var(--imprint-border)',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Total Posts {getSortIcon('totalPosts')}
            </th>
            <th
              onClick={() => handleSort('createdAt')}
              style={{
                padding: '12px',
                textAlign: 'right',
                borderBottom: '2px solid var(--imprint-border)',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Age {getSortIcon('createdAt')}
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid var(--imprint-border)',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Tags
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSubplebbits.map((sub, index) => (
            <tr
              key={sub.address}
              style={{
                backgroundColor: index % 2 === 0 ? 'var(--background)' : 'var(--imprint-section-bg)',
                borderBottom: '1px solid var(--imprint-border)'
              }}
            >
              <td style={{
                padding: '12px',
                maxWidth: '180px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
                wordBreak: 'break-all'
              }}>
                <a
                  href={`https://seedit.app/#/p/${sub.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--imprint-text-secondary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    wordBreak: 'break-all'
                  }}
                  title={sub.address}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {sub.address}
                </a>
              </td>
              <td style={{
                padding: '12px',
                fontSize: '14px',
                maxWidth: '160px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }} title={sub.title || 'No title'}>
                {sub.title || 'No title'}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                {sub.cph.toFixed(6)}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                {sub.totalPosts.toLocaleString()}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                {formatAge(sub.createdAt)}
              </td>
              <td style={{ padding: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '120px', overflow: 'hidden' }}>
                  {sub.tags && sub.tags.length > 0 ? (
                    sub.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'var(--imprint-border)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--imprint-text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '80px'
                        }}
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--imprint-text-muted)', fontSize: '12px' }}>No tags</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {subplebbits.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--foreground)', opacity: '0.6' }}>
          No subplebbit data available.
        </div>
      )}
    </div>
  );
}