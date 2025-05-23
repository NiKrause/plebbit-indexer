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

  useEffect(() => {
    // First check URL parameters
    const urlQuery = searchParams.get('q') || '';
    const urlSort = searchParams.get('sort');
    const urlTimeFilter = searchParams.get('t') || 'all';
    const urlIncludeReplies = searchParams.get('include-replies');
    
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

  // CSS styles with proper TypeScript types
  const searchStyles = {
    form: {
      width: '100%'
    },
    container: {
      position: 'relative' as const,
      display: 'flex' as const,
      alignItems: 'center' as const,
      flexDirection: 'column' as const,
      gap: '10px'
    },
    inputWrapper: {
      position: 'relative' as const,
      width: '100%',
      display: 'flex' as const,
      alignItems: 'center' as const,
    },
    input: {
      width: '100%',
      padding: '8px',
      paddingRight: '40px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      outline: 'none'
    },
    button: {
      position: 'absolute' as const,
      right: '8px',
      background: 'transparent',
      border: 'none',
      padding: '4px',
      cursor: 'pointer'
    },
    filterContainer: {
      display: 'flex' as const,
      gap: '10px',
      marginTop: '8px',
      width: '100%',
      flexWrap: 'wrap' as const
    },
    filterGroup: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '5px'
    },
    filterLabel: {
      fontSize: '10px'
    },
    filterItem: {
      padding: '4px 8px',
      fontSize: '10px',
      borderRadius: '4px',
      cursor: 'pointer',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      backgroundColor: 'white',
      color: '#4b5563'
    },
    filterActive: {
      backgroundColor: '#4b5563',
      color: 'white',
      borderColor: '#4b5563'
    },
    checkboxContainer: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '8px',
      padding: '4px 0'
    },
    checkbox: {
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: '12px',
      cursor: 'pointer'
    }
  };

  // Helper to combine styles conditionally
  const mergeStyles = (base: object, conditional: object, condition: boolean) => {
    return condition ? { ...base, ...conditional } : base;
  };

  return (
    <form onSubmit={handleSubmit} style={searchStyles.form}>
      <div style={searchStyles.container}>
        <div style={searchStyles.inputWrapper}>
          <input
            type="text"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            style={searchStyles.input}
          />
          <button
            type="submit"
            style={searchStyles.button}
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
        
        {/* Include Replies Checkbox */}
        <div style={searchStyles.checkboxContainer}>
          <input
            type="checkbox"
            id="include-replies"
            checked={includeReplies}
            onChange={(e) => handleFilterChange('includeReplies', e.target.checked)}
            style={searchStyles.checkbox}
          />
          <label htmlFor="include-replies" style={searchStyles.checkboxLabel}>
            Include replies
          </label>
        </div>
        
        {/* Filter options */}
        <div style={searchStyles.filterContainer}>
          {/* Sort options */}
          <div style={searchStyles.filterGroup}>
            <span style={searchStyles.filterLabel}>Sort:</span>
            {['new', 'top', 'replies', 'old'].map(sortOption => (
              <button
                key={sortOption}
                type="button"
                onClick={() => handleFilterChange('sort', sortOption)}
                style={mergeStyles(
                  searchStyles.filterItem,
                  searchStyles.filterActive,
                  sort === sortOption
                )}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Time filter options */}
          <div style={searchStyles.filterGroup}>
            <span style={searchStyles.filterLabel}>Time:</span>
            {['all', 'hour', 'day', 'week', 'month', 'year'].map(timeOption => (
              <button
                key={timeOption}
                type="button"
                onClick={() => handleFilterChange('time', timeOption)}
                style={mergeStyles(
                  searchStyles.filterItem,
                  searchStyles.filterActive,
                  timeFilter === timeOption
                )}
              >
                {timeOption.charAt(0).toUpperCase() + timeOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
} 