'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { requiresCookieConsent } from '../utils/geo';

// Create a context to share the analytics state
export const AnalyticsContext = React.createContext<{
  analyticsEnabled: boolean;
}>({ analyticsEnabled: false });

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const checkCountry = async () => {
      try {
        const needsConsent = await requiresCookieConsent();
        
        const consent = localStorage.getItem('cookie-consent');
        
        if (needsConsent) {
          // For countries requiring consent, show banner if no consent is stored
          if (consent === null) {
            setShowBanner(true);
          } else {
            setAnalyticsEnabled(consent === 'accepted');
          }
        } else {
          // For other countries, enable analytics by default
          if (consent === null) {
            localStorage.setItem('cookie-consent', 'accepted');
            setAnalyticsEnabled(true);
            window.gtag?.('consent', 'update', {
              'analytics_storage': 'granted'
            });
          } else {
            setAnalyticsEnabled(consent === 'accepted');
          }
        }
      } catch (error) {
        console.error('Error in checkCountry:', error);
        // Fallback: don't show banner and don't enable analytics
        setShowBanner(false);
        setAnalyticsEnabled(false);
      }
    };

    checkCountry();
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setAnalyticsEnabled(true);
    // Enable Google Analytics
    window.gtag?.('consent', 'update', {
      'analytics_storage': 'granted'
    });
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setAnalyticsEnabled(false);
    // Disable Google Analytics
    window.gtag?.('consent', 'update', {
      'analytics_storage': 'denied'
    });
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <AnalyticsContext.Provider value={{ analyticsEnabled }}>
      <div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] border shadow-xl rounded-lg w-[95vw] max-w-xl p-4 m-4"
        style={{
          background: '#eaf4fb', // light blue
          borderColor: '#2176ae', // logo blue
          boxShadow: '0 4px 24px rgba(33, 118, 174, 0.15)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <div className="flex-1" style={{ padding: '1rem' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#2176ae' }}>
              Cookie Consent
            </h3>
            <p
              className="text-sm"
              style={{
                color: '#4a4a4a', // dark gray
                marginBottom: '0.75rem',
                marginTop: '0.25rem',
                lineHeight: 1.6,
              }}
            >
              We use Google Analytics to understand how our service is used and to improve user experience.
              This helps us make {process.env.NEXT_PUBLIC_APP_TITLE ?? "PlebIndex"} better for everyone. You can choose to accept or decline analytics cookies.
            </p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={handleDecline}
              className="px-5 py-2 text-base font-semibold"
              style={{
                color: '#2176ae',
                background: '#eaf4fb',
                border: '1.5px solid #2176ae',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                margin: '1rem',
                transition: 'background 0.2s',
              }}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2 text-base font-semibold shadow"
              style={{
                color: '#fff',
                background: '#2176ae',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                margin: '1rem',
                transition: 'background 0.2s',
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </AnalyticsContext.Provider>
  );
} 