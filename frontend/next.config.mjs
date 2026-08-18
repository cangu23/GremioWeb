/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone mode: produces a minimal self-contained server suitable for Docker
  // https://nextjs.org/docs/pages/api-reference/next-config-js/output
  output: 'standalone',

  // Performance & Speed Optimizations
  swcMinify: true,
  compress: true,
  reactStrictMode: true,

  transpilePackages: ['@gremio-estelar/shared'],

  // Rewrite /api requests to the Express backend running on internal port 4001
  // This avoids the need for a reverse proxy — Next.js handles frontend + proxies API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4001/api/:path*',
      },
      // WebSocket upgrade requests also go through the same host.
      // Dos entradas: el path raíz exacto (/socket.io sin segmentos, que es el
      // que usa el handshake de Socket.IO con trailing-slash normalizado por
      // Next.js) y el wildcard de subpaths.
      {
        source: '/socket.io',
        destination: 'http://127.0.0.1:4001/socket.io',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:4001/socket.io/:path*',
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['@gremio-estelar/shared'],
  },

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // Disable ESLint during builds (handled separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;