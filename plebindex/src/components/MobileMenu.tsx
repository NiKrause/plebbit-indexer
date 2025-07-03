'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('mobile-menu');
      if (menu && !menu.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden"
        aria-label="Open menu"
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <div
        id="mobile-menu"
style={{
          backgroundColor: 'var(--background)',
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          boxShadow: '-2px 0 5px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <Link
              href="/subplebbits"
              onClick={() => setIsOpen(false)}
              className="header-text-link"
              style={{
                padding: '8px 0',
                textDecoration: 'none',
              }}
            >
              Subplebbits
            </Link>
            <Link
              href="https://t.me/plebbitindexer"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '8px 0',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--foreground)',
              }}
            >
              <Image src="/telegram.svg" alt="Telegram" width={20} height={20} className="dark-mode-icon" />
              Telegram
            </Link>
            <Link
              href="https://github.com/NiKrause/plebbit-indexer/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              style={{
                padding: '8px 0',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--foreground)',
              }}
            >
              <Image src="/github.svg" alt="GitHub" width={20} height={20} className="dark-mode-icon" />
              GitHub
            </Link>
            <Link
              href="/imprint"
              onClick={() => setIsOpen(false)}
              className="header-text-link"
              style={{
                padding: '8px 0',
                textDecoration: 'none',
              }}
            >
              Imprint
            </Link>
            <button
              id="dark-mode-toggle-mobile"
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined' && window.toggleDarkMode) {
                  window.toggleDarkMode();
                }
                setIsOpen(false);
              }}
              style={{
                padding: '8px 0',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'inherit',
                color: 'var(--foreground)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M17.68 17.68l.7.7M1 12h1M20 12h1M4.22 19.78l.7-.7M17.68 6.32l.7-.7M12 7a5 5 0 000 10 5 5 0 000-10z"/>
              </svg>
              Toggle Dark Mode
            </button>
          </nav>
        </div>
      </div>
    </>
  );
} 