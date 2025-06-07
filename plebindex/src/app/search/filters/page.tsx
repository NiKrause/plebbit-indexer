'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FilterContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const sort = searchParams?.get('sort') || 'new';
  const timeFilter = searchParams?.get('t') || 'all';
  const includeReplies = searchParams?.get('include-replies') !== 'false';

  return (
    <div style={{
      padding: '20px',
      maxWidth: '400px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
      }}>
        Filters
      </h2>
      
      <form action="/search" method="get">
        <input type="hidden" name="q" value={query} />
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="t" value={timeFilter} />
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <input
              type="checkbox"
              name="include-replies"
              value="true"
              defaultChecked={includeReplies}
            />
            Include replies
          </label>
          
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}

export default function FilterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FilterContent />
    </Suspense>
  );
}