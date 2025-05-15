'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Initialize query from URL on component mount and when URL changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    setQuery(urlQuery);
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : '/');
  };

  // CSS styles with proper TypeScript types
  const searchStyles = {
    form: {
      width: '100%'
    },
    container: {
      position: 'relative' as const,
      display: 'flex' as const,
      alignItems: 'center' as const
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
    }
  };

  return (
    <form onSubmit={handleSubmit} style={searchStyles.form}>
      <div style={searchStyles.container}>
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
    </form>
  );
} 