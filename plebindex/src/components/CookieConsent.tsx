'use client';

import { useState, useEffect } from 'react';
import React from 'react';

// Create a context to share the analytics state
export const AnalyticsContext = React.createContext<{
  analyticsEnabled: boolean;
}>({ analyticsEnabled: false });

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Add debug logging
    console.log('CookieConsent mounted');
    const consent = localStorage.getItem('cookie-consent');
    console.log('Current consent value:', consent);
    if (consent === null) {
      console.log('Setting showBanner to true');
      setShowBanner(true);
    } else {
      const enabled = consent === 'accepted';
      console.log('Setting analyticsEnabled to:', enabled);
      setAnalyticsEnabled(enabled);
    }
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
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
              <p className="text-gray-600 text-sm">
                We use Google Analytics to understand how our service is used and to improve user experience. 
                This helps us make Plebindex better for everyone. You can choose to accept or decline analytics cookies.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsContext.Provider>
  );
} 