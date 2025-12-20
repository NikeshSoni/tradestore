/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['@clerk/nextjs'],
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
  },
};

export default nextConfig;
