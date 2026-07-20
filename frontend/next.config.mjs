/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone mode: produces a minimal self-contained server suitable for Docker
  // https://nextjs.org/docs/pages/api-reference/next-config-js/output
  output: 'standalone',

  transpilePackages: ['@gremio-estelar/shared'],

  // Rewrite /api requests to the Express backend running on internal port 4001
  // This avoids the need for a reverse proxy — Next.js handles frontend + proxies API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4001/api/:path*',
      },
      // WebSocket upgrade requests also go through the same host
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:4001/socket.io/:path*',
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  // Disable ESLint during builds (handled separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;