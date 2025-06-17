import { getApiBaseUrl } from './admin';
import { SubplebbitsResponse } from '../types';

export async function getSubplebbits(): Promise<SubplebbitsResponse | null> {
  const apiBaseUrl = getApiBaseUrl();
  
  const baseEndpoint = 'api/subplebbits';
  const url = apiBaseUrl ? `${apiBaseUrl}/${baseEndpoint}` : baseEndpoint;
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching subplebbits:', error);
    return null;
  }
}