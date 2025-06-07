import Link from 'next/link';
import Image from 'next/image';

export default function MenuPage() {
  return (
    <div style={{
      padding: '20px',
      maxWidth: '300px',
      margin: '0 auto',
    }}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Link
          href="/imprint"
          style={{
            padding: '8px 0',
            color: '#4b5563',
            textDecoration: 'none',
          }}
        >
          Imprint
        </Link>
        <Link
          href="https://github.com/NiKrause/plebbit-indexer/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 0',
            color: '#4b5563',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Image src="/github.svg" alt="GitHub" width={20} height={20} />
          GitHub
        </Link>
        <Link
          href="https://t.me/plebbitindexer"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 0',
            color: '#4b5563',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Image src="/telegram.svg" alt="Telegram" width={20} height={20} />
          Telegram
        </Link>
      </nav>
    </div>
  );
} 