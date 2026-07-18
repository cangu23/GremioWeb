/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone mode: produces a minimal self-contained server suitable for Docker
  // https://nextjs.org/docs/pages/api-reference/next-config-js/output
  output: 'standalone',

  transpilePackages: ['@gremio-estelar/shared'],
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
};

export default nextConfig;