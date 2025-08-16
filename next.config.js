/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.gr-assets.com' },
      { protocol: 'https', hostname: 'i.gr-assets.com' },
      { protocol: 'https', hostname: 's.gr-assets.com' }
    ]
  }
};

module.exports = nextConfig;
