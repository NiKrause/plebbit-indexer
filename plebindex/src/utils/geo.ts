// List of EU country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export async function isEUCountry(): Promise<boolean> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    console.log('Country detected:', data.country_code);
    return EU_COUNTRIES.includes(data.country_code);
  } catch (error) {
    console.error('Error detecting country:', error);
    //if we can't detect the country, we don't want to show the consent banner since it might be blocked by sanctions / russia or similar
    return false;
  }
} 