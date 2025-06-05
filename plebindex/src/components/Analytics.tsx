'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';
import { isEUCountry } from '../utils/geo';

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const consent = localStorage.getItem('cookie-consent');
      const euCountry = await isEUCountry();
      
      // Enable analytics if either:
      // 1. User has explicitly consented
      // 2. User is from a non-EU country and no consent is stored
      setHasConsent(consent === 'accepted' || (!euCountry && consent === null));
    };

    checkConsent();
  }, []);

  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-GPL56C3ZBM" />;
} 