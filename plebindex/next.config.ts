import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Function to check if a service is available
    const isServiceAvailable = async (url: string) => {
      try {
        const response = await fetch(url + '/api/posts', { 
          method: 'HEAD',
          // Add a short timeout to avoid hanging
          signal: AbortSignal.timeout(2000)
        });
        return response.ok;
      } catch (error) {
        console.error(`Service at ${url} is not available:`, error);
        return false;
      }
    };

    // Check both crawler instances
    const crawler01Available = await isServiceAvailable('http://crawler01:3001');
    const crawler02Available = await isServiceAvailable('http://crawler02:3001');

    // Determine which crawler to use
    const activeCrawler = crawler01Available ? 'crawler01' : 
                         crawler02Available ? 'crawler02' : 
                         'crawler01'; // Fallback to crawler01 if both are down

    console.log(`Using ${activeCrawler} for sitemap requests`);

    return [
      {
        source: '/sitemap.xml',
        destination: `http://${activeCrawler}:3001/sitemap.xml`,
      },
      {
        source: '/sitemap-:page.xml',
        destination: `http://${activeCrawler}:3001/sitemap-:page.xml`,
      },
    ];
  },
};

export default nextConfig;
