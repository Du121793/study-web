/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 因為不支援
  // swcMinify: true,
  images: {
    domains: ['profile.line-scdn.net', 'localhost'],
  },
}

module.exports = nextConfig
