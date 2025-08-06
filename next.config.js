/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build if needed
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
