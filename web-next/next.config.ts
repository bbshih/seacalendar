import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // For PM2 deployment
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
