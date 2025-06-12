import Header from '../header';
import SubplebbitsTable from '../../components/SubplebbitsTable';
import type { Metadata } from 'next';

// Force dynamic rendering - this prevents static prerendering
export const dynamic = 'force-dynamic';

// Export metadata for the page
export const metadata: Metadata = {
  title: 'Subplebbit Stats - Plebscan',
  description: 'Browse statistics for all known subplebbits including activity levels and post counts.',
};

export default function SubplebbitsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pt-8 pb-6">
        <div style={{ marginBottom: '20px', padding: '0 16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '16px 0 8px 0' }}>
            Subplebbit Statistics
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Browse all known subplebbits and their activity statistics. CPH (Comments Per Hour) is averaged over the last 7 days.
            Click column headers to sort.
          </p>
        </div>

        <div style={{ padding: '0 16px' }}>
          <SubplebbitsTable />
        </div>
      </main>
    </div>
  );
}