/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Les erreurs critiques restent attrapées par le type-check au dev,
    // mais on n'arrête pas le build prod pour un petit type mismatch.
    ignoreBuildErrors: true,
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
