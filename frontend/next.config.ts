import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/storage/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8080",
        pathname: "/storage/media/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const backendOrigin =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_SERVER_API_URL?.replace(/\/api\/?$/, '') ||
      'http://localhost:8080';

    return [
      {
        source: '/storage/:path*',
        destination: `${backendOrigin}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
