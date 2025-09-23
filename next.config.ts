import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove manual env configuration - Next.js automatically loads NEXT_PUBLIC_* variables from .env.local

  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],

    // Quality settings for different use cases
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Optimize images for better performance
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Add domains if you're using external image sources
    domains: ['localhost'],

    // Configure remote patterns for external image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'piktor-app.firebasestorage.app',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/placeholder/**',
      },
      {
        protocol: 'https',
        hostname: process.env.VERCEL_URL || 'your-domain.com',
        pathname: '/api/placeholder/**',
      }
    ],

    // Optimize gallery images specifically
    unoptimized: false,
  },

  // Enable compression for all assets
  compress: true,

  // Optimize static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  }
};

export default nextConfig;
