import Link from 'next/link';
import Image from 'next/image';
import PlebscanLogo from './plebscanlogo';
import SearchBar from './search';
import './header.css';
import MobileMenu from '../components/MobileMenu';

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

export default function Header() {
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

        {/* Search row */}
        <div style={styles.searchContainer}>
          <SearchBar aria-label="Search content" />
        </div>
      </div>
    </header>
  );
}
