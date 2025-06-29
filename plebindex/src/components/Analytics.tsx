'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';
import { requiresCookieConsent } from '../utils/geo';

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
    
    const checkConsent = async () => {
      try {
        const consent = localStorage.getItem('cookie-consent');
        
        // If consent is already stored, use it directly
        if (consent !== null) {
          setHasConsent(consent === 'accepted');
          return;
        }
        
        // Only call geo API if no consent is stored
        const needsConsent = await requiresCookieConsent();
        
        // Enable analytics if user is from a non-EU country and no consent is stored
        setHasConsent(!needsConsent);
      } catch (error) {
        console.error('Error in checkConsent:', error);
        // Fallback: only enable if user has explicitly consented
        const consent = localStorage.getItem('cookie-consent');
        setHasConsent(consent === 'accepted');
      }
    };

    checkConsent();
  }, []);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null;
  }

  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-GPL56C3ZBM" />;
} 