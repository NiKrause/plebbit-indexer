'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new');
  const [timeFilter, setTimeFilter] = useState('all');
  const [includeReplies, setIncludeReplies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);

  useEffect(() => {
    // First check URL parameters
    const urlQuery = searchParams?.get('q') || '';
    const urlSort = searchParams?.get('sort');
    const urlTimeFilter = searchParams?.get('t') || 'all';
    const urlIncludeReplies = searchParams?.get('include-replies');
    
    setQuery(urlQuery);
    
    // If sort is specified in URL, use it and save to localStorage
    if (urlSort) {
      setSort(urlSort);
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredSort', urlSort);
      }
    } 
    // Otherwise try to get from localStorage
    else {
      if (typeof window !== 'undefined') {
        const savedSort = localStorage.getItem('preferredSort');
        setSort(savedSort || 'new');
      }
    }
    
    setTimeFilter(urlTimeFilter);
    
    // Handle include-replies parameter - defaults to true
    if (urlIncludeReplies !== null) {
      setIncludeReplies(urlIncludeReplies === 'true');
    } else {
      setIncludeReplies(true); // Default to true when not specified
    }
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    
    try {
      // Validate query if needed
      if (query.trim().length < 2) {
        setError('Search query must be at least 2 characters long');
        return;
      }
      
      // Construct URL with all parameters
      let url = '/search';
      
      // Add search query if present
      if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }
      
      // Add sort parameter if not default
      if (sort !== 'new') {
        url += query ? `&sort=${sort}` : `?sort=${sort}`;
      }
      
      // Add time filter parameter if not default
      if (timeFilter !== 'all') {
        url += url.includes('?') ? `&t=${timeFilter}` : `?t=${timeFilter}`;
      }
      
      // Add include-replies parameter if not default (default is true)
      if (!includeReplies) {
        url += url.includes('?') ? `&include-replies=false` : `?include-replies=false`;
      }
      
      router.push(url);
    } catch (err) {
      setError('An error occurred while processing your search. Please try again.');
      console.error('Search error:', err);
    }
  };

  // Function to update a single filter
  const handleFilterChange = (type: 'sort' | 'time' | 'includeReplies', value: string | boolean) => {
    // Update the local state
    if (type === 'sort') {
      setSort(value as string);
      // Save sort preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredSort', value as string);
      }
    } else if (type === 'time') {
      setTimeFilter(value as string);
    } else if (type === 'includeReplies') {
      setIncludeReplies(value as boolean);
    }
    
    // Update URL with all current parameters
    let url = '/search';
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    
    // Set new sort value if changing sort, otherwise use current
    if (type === 'sort') {
      if (value !== 'new') params.set('sort', value as string);
    } else if (sort !== 'new') {
      params.set('sort', sort);
    }
    
    // Set new time value if changing time, otherwise use current
    if (type === 'time') {
      if (value !== 'all') params.set('t', value as string); 
    } else if (timeFilter !== 'all') {
      params.set('t', timeFilter);
    }
    
    // Set include-replies value if changing or if it's false (only add when false since true is default)
    if (type === 'includeReplies') {
      if (!(value as boolean)) params.set('include-replies', 'false');
    } else if (!includeReplies) {
      params.set('include-replies', 'false');
    }
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    router.push(url);
  };

  const styles = {
    form: {
      width: '100%'
    },
    container: {
      position: 'relative' as const,
      display: 'flex' as const,
      alignItems: 'left' as const,
      flexDirection: 'column' as const,
      gap: '12px'
    },
    inputWrapper: {
      position: 'relative' as const,
      width: '100%',
      display: 'flex' as const,
      alignItems: 'left' as const,
    },
    input: {
      width: '100%',
      padding: '8px 40px 8px 12px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      outline: 'none'
    },
    button: {
      position: 'absolute' as const,
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      padding: '4px',
      cursor: 'pointer',
      color: '#9ca3af'
    },
    filterContainer: {
      display: 'flex',
      gap: '10px',
      marginTop: '8px',
      width: '100%',
      flexWrap: 'wrap' as const,
      justifyContent: 'flex-start'
    },
    filterButton: {
      padding: '4px 8px',
      fontSize: '10px',
      borderRadius: '4px',
      cursor: 'pointer',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      backgroundColor: 'white',
      color: '#4b5563',
      display: 'flex' as const,
      alignItems: 'left' as const,
      gap: '4px',
    },
    dropdownContainer: {
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-start'
    },
    dropdownButton: {
      padding: '4px 8px',
      fontSize: '10px',
      borderRadius: '4px',
      cursor: 'pointer',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      backgroundColor: 'white',
      color: '#4b5563',
      display: 'flex' as const,
      alignItems: 'left' as const,
      gap: '4px',
      width: 'auto',
      whiteSpace: 'nowrap'
    },
    dropdownContent: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      minWidth: '200px',
      backgroundColor: 'white',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      padding: '8px',
      zIndex: 1000,
      width: 'max-content'
    },
    dropdownItem: {
      padding: '4px 8px',
      cursor: 'pointer',
    },
    dropdownItemActive: {
      backgroundColor: '#f3f4f6',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    checkbox: {
      marginRight: '8px',
    },
    checkboxLabel: {
      marginRight: '16px',
    },
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.container}>
        {/* Error message */}
        {error && (
          <div 
            role="alert" 
            aria-live="polite"
            style={{
              color: '#dc2626',
              fontSize: '14px',
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: '#fee2e2',
              borderRadius: '4px',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        )}

        <div style={styles.inputWrapper}>
          <input
            id="search"
            type="text"
            name="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder="Search posts..."
            style={styles.input}
            aria-label="Search posts"
            role="searchbox"
          />
          <button
            type="submit"
            style={styles.button}
            aria-label="Search"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        
        {/* Filter options */}
        <div style={styles.filterContainer}>
          {/* Sort dropdown */}
          <div style={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsTimeOpen(false);
              }}
              style={styles.dropdownButton}
            >
              Sort: {sort.charAt(0).toUpperCase() + sort.slice(1)}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isSortOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isSortOpen && (
              <div style={styles.dropdownContent}>
                {['new', 'top', 'replies', 'old'].map(sortOption => (
                  <div
                    key={sortOption}
                    onClick={() => {
                      handleFilterChange('sort', sortOption);
                      setIsSortOpen(false);
                    }}
                    style={{
                      ...styles.dropdownItem,
                      ...(sort === sortOption ? styles.dropdownItemActive : {}),
                    }}
                  >
                    {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time filter dropdown */}
          <div style={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setIsTimeOpen(!isTimeOpen);
                setIsSortOpen(false);
              }}
              style={styles.dropdownButton}
            >
              Time: {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isTimeOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isTimeOpen && (
              <div style={styles.dropdownContent}>
                {['all', 'hour', 'day', 'week', 'month', 'year'].map(timeOption => (
                  <div
                    key={timeOption}
                    onClick={() => {
                      handleFilterChange('time', timeOption);
                      setIsTimeOpen(false);
                    }}
                    style={{
                      ...styles.dropdownItem,
                      ...(timeFilter === timeOption ? styles.dropdownItemActive : {}),
                    }}
                  >
                    {timeOption.charAt(0).toUpperCase() + timeOption.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Replace the checkbox container with a dropdown */}
          <div style={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setIsRepliesOpen(!isRepliesOpen);
                setIsSortOpen(false);
                setIsTimeOpen(false);
              }}
              style={styles.dropdownButton}
            >
              Replies: {includeReplies ? 'Included' : 'Excluded'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isRepliesOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isRepliesOpen && (
              <div style={styles.dropdownContent}>
                {[
                  { value: true, label: 'Included' },
                  { value: false, label: 'Excluded' }
                ].map(option => (
                  <div
                    key={option.label}
                    onClick={() => {
                      handleFilterChange('includeReplies', option.value);
                      setIsRepliesOpen(false);
                    }}
                    style={{
                      ...styles.dropdownItem,
                      ...(includeReplies === option.value ? styles.dropdownItemActive : {}),
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
} 