/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove swcMinify as it's no longer needed in newer Next.js versions
  eslint: {
    // Add ESLint configuration
    ignoreDuringBuilds: false, // Set to true if you want to ignore ESLint errors during builds
  },
  // Add any other necessary configurations here
};

module.exports = nextConfig;
