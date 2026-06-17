import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NO usar output: "standalone" en Vercel - causa NOT_FOUND
  // "standalone" es solo para Docker/self-hosted
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // Configuración para imágenes externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
