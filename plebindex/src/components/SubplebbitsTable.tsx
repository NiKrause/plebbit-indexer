'use client';

import { useState, useEffect } from 'react';
import { SubplebbitStats } from '../types';
import { getSubplebbits } from '../api/subplebbits';

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

export default function SubplebbitsTable() {
  const [subplebbits, setSubplebbits] = useState<SubplebbitStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalPosts');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getSubplebbits();
        if (data) {
          setSubplebbits(data.subplebbits);
        } else {
          setError('Failed to load subplebbit data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  if (loading) {
    return (
      <div className="text-center">
        <div style={{ padding: '40px', color: '#666' }}>
          Loading subplebbit statistics...
        </div>
      </div>
    );
  }

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
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: '4px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th
              onClick={() => handleSort('address')}
              style={{
                // padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid #dee2e6',
                cursor: 'pointer',
                userSelect: 'none',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Subplebbit Address {getSortIcon('address')}
            </th>
            <th
              onClick={() => handleSort('cph')}
              style={{
                // padding: '12px',
                textAlign: 'right',
                borderBottom: '2px solid #dee2e6',
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
                borderBottom: '2px solid #dee2e6',
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
                borderBottom: '2px solid #dee2e6',
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
                borderBottom: '2px solid #dee2e6',
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
                backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                borderBottom: '1px solid #dee2e6'
              }}
            >
              <td style={{ padding: '0px' }}>
                <a
                  href={`https://seedit.app/#/p/${sub.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontSize: '14px',
                    wordBreak: 'break-all'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {sub.address}
                </a>
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
                {sub.tags && sub.tags.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {sub.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: '#e9ecef',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#495057'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>No tags</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {subplebbits.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
          No subplebbit data available.
        </div>
      )}
    </div>
  );
}