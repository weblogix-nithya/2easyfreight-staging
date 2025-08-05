/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.ap-southeast-2.amazonaws.com',
        pathname: '/2easy-prod-bucket/**',
      },
    ],
  },
};

module.exports = nextConfig;
