/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gremio-estelar/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;