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
    return false;
  }

  try {
    // Try multiple geolocation services for better reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ipapi.com/json/',
      // 'https://api.ipify.org?format=json'
    ];

    for (const serviceUrl of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout per service
        
        const response = await fetch(serviceUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code || data.country;
          
          if (countryCode) {
            console.log('Country detected:', countryCode, 'from', serviceUrl);
            
            // Special handling for US (California)
            if (countryCode === 'US') {
              return data.region_code === 'CA';
            }
            
            return CONSENT_REQUIRED_COUNTRIES.includes(countryCode);
          }
        }
      } catch (serviceError) {
        console.warn(`Service ${serviceUrl} failed:`, serviceError);
        continue; // Try next service
      }
    }
    
    // If all services fail, assume consent is required
    console.warn('All geolocation services failed, assuming consent required');
    return true;
    
  } catch (error) {
    console.error('Error detecting country:', error);
    // If we can't detect the country, assume consent is required (safer approach)
    return true;
  }
} 