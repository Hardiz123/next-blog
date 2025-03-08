/** @type {import('next').NextConfig} */
const nextConfig = {
  images:{
    domains:["lh3.googleusercontent.com","firebasestorage.googleapis.com"]
  },
  webpack: (config) => {
    // This enables handling the 'text/event-stream' content type
    config.module.rules.push({
      test: /\.ndjson$/,
      use: 'raw-loader',
    });
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
}

module.exports = nextConfig
