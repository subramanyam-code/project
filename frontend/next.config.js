/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is only used for Docker self-hosted builds.
  // On Netlify, @netlify/plugin-nextjs manages output — do not set it there.
  // The Docker build sets NEXT_OUTPUT=standalone via ENV in the Dockerfile.
  ...(process.env.NEXT_OUTPUT === "standalone" && { output: "standalone" }),

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },

  // Local Docker: proxy /api/* → backend container via NEXT_PUBLIC_API_URL
  // Netlify: netlify.toml redirects handle /api/* → Render, no rewrite needed
  async rewrites() {
    if (process.env.NETLIFY) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
