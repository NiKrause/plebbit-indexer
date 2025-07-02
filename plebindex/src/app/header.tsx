import Link from 'next/link';
import Image from 'next/image';
import PlebscanLogo from './plebscanlogo';
import SearchBar from './search';
import './header.css';
import MobileMenu from '../components/MobileMenu';
// import { Suspense } from 'react';

const styles = {
  header: {
    width: '100%',
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0',
    padding: '0 16px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoText: {
    marginLeft: '8px',
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  searchContainer: {
    width: '100%',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  filterContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  socialContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },
  iconLink: {
    opacity: '1',
    transition: 'opacity 0.2s',
  },
  menuButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
  },
};

export default function Header({ pathname }: { pathname: string }) {
  const isSubplebbitsPage = pathname === '/subplebbits';

  return (
    <header style={styles.header} role="banner">
      <div style={styles.container}>
        {/* Top row: Logo + Social Links */}
        <div style={styles.topRow}>
          <div style={styles.logoContainer}>
            <Link href="/" rel="noopener noreferrer" aria-label="Home">
              <PlebscanLogo />
            </Link>
            <span style={styles.logoText}>Plebscan</span>
          </div>
          
          <div style={styles.socialContainer}>
            <Link
              href="/subplebbits"
              title="Subplebbits"
              style={styles.iconLink}
              aria-label="Subplebbits Statistics"
              className="hidden md:inline"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
              </svg>
            </Link>
        
            <Link
              href="https://github.com/NiKrause/plebbit-indexer/"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              style={styles.iconLink}
              aria-label="Visit our GitHub repository"
              className="hidden md:inline"
            >
              <Image src="/github.svg" alt="GitHub" width={24} height={24} />
            </Link>
            <Link
              href="https://t.me/plebbitindexer"
              target="_blank"
              rel="noopener noreferrer"
              title="Telegram Channel"
              style={styles.iconLink}
              aria-label="Join our Telegram channel"
              className="hidden md:inline"
            >
              <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
            </Link>
            <Link
              href="/imprint"
              title="Imprint"
              style={styles.iconLink}
              aria-label="Legal information"
              className="hidden md:inline"
            >
              Imprint
            </Link>
            <MobileMenu />
          </div>
        </div>

        {/* Search row - only show if not on subplebbits page */}
        {!isSubplebbitsPage && (
          <div style={styles.searchContainer}>
            {/* <Suspense fallback={<div>Loading search...</div>}> */}
              <SearchBar aria-label="Search content" />
            {/* </Suspense> */}
          </div>
        )}
      </div>
    </header>
  );
}
