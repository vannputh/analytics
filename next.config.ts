import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=(), interest-cohort=()",
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/entries",
        destination: "/movies",
        permanent: true,
      },
      {
        source: "/library",
        destination: "/movies",
        permanent: true,
      },
      {
        source: "/watching",
        destination: "/movies/watching",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
