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
  // Ensure this code only runs on the client side
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side');
  }

  // Skip API call in development to avoid rate limits
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: skipping geolocation API call');
    // Return false to not show consent banner in development
    // Change to true if you want to test the consent banner
    return false;
  }

  try {
    // Use IP-based geolocation
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const countryCode = data.country_code;
    
    console.log('Country detected:', countryCode);
    
    // Special handling for US (California)
    if (countryCode === 'US') {
      return data.region_code === 'CA';
    }
    
    return CONSENT_REQUIRED_COUNTRIES.includes(countryCode);
  } catch (error) {
    console.error('Error detecting country:', error);
    // If we can't detect the country, we don't want to show the consent banner
    // since it might be blocked by sanctions / russia or similar
    return false;
  }
} 