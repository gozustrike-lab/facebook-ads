import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NO usar output: "standalone" en Vercel - causa NOT_FOUND
  typescript: {
    ignoreBuildErrors: true,
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
