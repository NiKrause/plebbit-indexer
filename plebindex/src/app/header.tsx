import Link from 'next/link';
import Image from 'next/image';
import PlebscanLogo from './plebscanlogo';
import SearchBar from './search';
import './header.css';

const styles = {
  header: {
    width: '100%',
    borderBottom: '1px solid #e5e7eb',
    padding: '12px 0'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },
  logoText: {
    marginLeft: '8px',
    fontSize: '1.25rem',
    fontWeight: 'bold'
  },
  searchContainer: {
    flex: '1',
    maxWidth: '400px',
    margin: '0 16px'
  },
  socialContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0
  },
  iconLink: {
    opacity: '1',
    transition: 'opacity 0.2s'
  }
};

export default function Header() {
  return (
    <header style={styles.header} role="banner">
      <div style={styles.container}>
        <nav className="header-flex-row" role="navigation" aria-label="Main navigation">
          <div style={styles.logoContainer}>
            <Link href="/" rel="noopener noreferrer" aria-label="Home">
              <PlebscanLogo />
            </Link>
            <span style={styles.logoText}>Plebscan</span>
          </div>
          
          <div style={styles.searchContainer} className="search-container">
            <SearchBar aria-label="Search content" />
          </div>
          
          <div style={styles.socialContainer} role="navigation" aria-label="Social media links">
            <Link
              href="/imprint"
              title="Imprint"
              style={styles.iconLink}
              aria-label="Legal information"
            >
              Imprint
            </Link>
            <Link
              href="https://github.com/NiKrause/plebbit-indexer/"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              style={styles.iconLink}
              aria-label="Visit our GitHub repository"
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
            >
              <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
