/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  env: {
    // Make environment variables available to the client
    NEXT_PUBLIC_BASE_URL: process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
    VERCEL_URL: process.env.VERCEL_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  webpack: (config) => {
    // This enables handling the 'text/event-stream' content type
    config.module.rules.push({
      test: /\.ndjson$/,
      use: 'raw-loader',
    });
    config.externals.push('encoding', /* add any other modules that might be causing the error */);
    return config;
  },
  async headers() {
    return [
      {
        // This adds headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // Special headers for SSE routes
        source: '/api/sse',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/event-stream',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-transform',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Exclude the write page from static generation
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
  },
  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable strict mode for better error detection
  reactStrictMode: true,
  // Ensure trailing slashes are handled consistently
  trailingSlash: false,
  // Exclude specific pages from static generation
};

module.exports = nextConfig;
