'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useEffect, useState } from 'react';

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    setHasConsent(consent === 'accepted');
  }, []);

  if (!hasConsent) {
    return null;
  }

  return <GoogleAnalytics gaId="G-GPL56C3ZBM" />;
} 