import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: 'http://crawler01:3001/sitemap.xml',
      },
      {
        source: '/sitemap-:page.xml',
        destination: 'http://crawler01:3001/sitemap-:page.xml',
      },
    ];
  },
};

export default nextConfig;
