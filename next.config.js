/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true, // Keep minification enabled
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

module.exports = nextConfig;
