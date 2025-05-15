import Link from 'next/link';
import Image from 'next/image';
import SeeditLogo from '../app/seeditlogo';
import SearchBar from '../app/search';
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
    <header style={styles.header}>
      <div style={styles.container}>
        <div className="header-flex-row">
          <div style={styles.logoContainer}>
            <Link href="https://seedit.app/" target="_blank" rel="noopener noreferrer">
              <SeeditLogo />
            </Link>
            <span style={styles.logoText}>Plebscan</span>
          </div>
          
          <div style={styles.searchContainer} className="search-container">
            <SearchBar />
          </div>
          
          <div style={styles.socialContainer}>
            <Link
              href="https://github.com/NiKrause/plebbit-indexer/"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              style={styles.iconLink}
            >
              <Image src="/github.svg" alt="GitHub" width={24} height={24} />
            </Link>
            <Link
              href="https://t.me/plebbitindexer"
              target="_blank"
              rel="noopener noreferrer"
              title="Telegram Channel"
              style={styles.iconLink}
            >
              <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
