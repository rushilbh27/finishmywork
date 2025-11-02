/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
