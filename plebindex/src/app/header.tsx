import Link from 'next/link';
import Image from 'next/image';
import SeeditLogo from '../app/seeditlogo';
import SearchBar from '../app/search';

// Inline CSS für den Header
const headerStyles = {
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
  flexRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginRight: '16px',
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
  },
  iconLinkHover: {
    opacity: '0.8'
  }
};

export default function Header() {
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        <div style={headerStyles.flexRow}>
          {/* Logo und Name - linke Seite */}
          <div style={headerStyles.logoContainer}>
            <Link href="https://seedit.app/" target="_blank" rel="noopener noreferrer">
              <SeeditLogo />
            </Link>
            <span style={headerStyles.logoText}>Plebscan</span>
          </div>
          
          {/* Suchleiste - mittlerer Bereich */}
          <div style={headerStyles.searchContainer}>
            <SearchBar />
          </div>
          
          {/* Social Media Links - rechte Seite */}
          <div style={headerStyles.socialContainer}>
            <Link
              href="https://github.com/NiKrause/plebbit-indexer/"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              style={headerStyles.iconLink}
            >
              <Image src="/github.svg" alt="GitHub" width={24} height={24} />
            </Link>
            <Link
              href="https://t.me/plebbitindexer"
              target="_blank"
              rel="noopener noreferrer"
              title="Telegram Channel"
              style={headerStyles.iconLink}
            >
              <Image src="/telegram.svg" alt="Telegram" width={24} height={24} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
