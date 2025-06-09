// List of countries that require cookie consent
const CONSENT_REQUIRED_COUNTRIES = [
  // EU countries
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // UK
  'GB',
  // Brazil
  'BR',
  // California (US) - Note: This is handled separately as it's a state, not a country
  // South Korea
  'KR',
  // Japan
  'JP',
  // Canada
  'CA',
  // Australia
  'AU',
  // South Africa
  'ZA',
  // India
  'IN'
];

export async function requiresCookieConsent(): Promise<boolean> {
  try {
    
    return true;
    // First try to get location from browser's geolocation API
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    // Then use the coordinates to get country info
    const response = await fetch(`https://ipapi.co/${position.coords.latitude},${position.coords.longitude}/json/`);
    const data = await response.json();
    console.log('Country detected:', data.country_code);
    
    // Special handling for US (California)
    if (data.country_code === 'US') {
      return data.region_code === 'CA';
    }
    
    return CONSENT_REQUIRED_COUNTRIES.includes(data.country_code);
  } catch (error) {
    console.error('Error detecting country:', error);
    // If we can't detect the country, we don't want to show the consent banner
    // since it might be blocked by sanctions / russia or similar
    return false;
  }
} 