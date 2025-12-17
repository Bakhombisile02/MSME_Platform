/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers to prevent XSS, clickjacking, and other attacks
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '72.60.36.42',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ceec-msme.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cms.ceec-msme.com',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  devIndicators: false,
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
