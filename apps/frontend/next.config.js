/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@omniai/types'],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  eslint: {
    // Ne pas bloquer le build sur des warnings ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // En cas d'erreurs de typage strict pendant le build prod,
    // ne pas bloquer (les erreurs critiques restent gérées au dev).
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
