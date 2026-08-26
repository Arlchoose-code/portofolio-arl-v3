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
  async redirects() {
    return [
      {
        source: '/skills',
        destination: '/about?tab=skills',
        permanent: true,
      },
      {
        source: '/experiences',
        destination: '/about?tab=experience',
        permanent: true,
      },
      {
        source: '/certificates',
        destination: '/about?tab=certificates',
        permanent: true,
      },
      {
        source: '/educations',
        destination: '/about?tab=education',
        permanent: true,
      },
    ];
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
      {
        source: '/api/public/:path*',
        destination: `${backendOrigin}/api/public/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${backendOrigin}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
