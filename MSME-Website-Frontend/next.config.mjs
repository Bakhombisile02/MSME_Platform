/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
