/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com', 'utfs.io'],
  },
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
