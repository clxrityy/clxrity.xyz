/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep edge functions small; no serverComponentsExternalPackages to avoid Prisma in edge routes
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "twemoji.maxcdn.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/tos", permanent: true },
      { source: "/terms-of-service", destination: "/tos", permanent: true },
      // Privacy aliases → anchor
      { source: "/privacy", destination: "/tos#privacy", permanent: true },
      {
        source: "/privacy-policy",
        destination: "/tos#privacy",
        permanent: true,
      },
      {
        source: "/privacy-policty",
        destination: "/tos#privacy",
        permanent: true,
      },
    ];
  },
  // allowedDevOrigins: [process.env.CF_TUNNEL_URL], // Comment out in production
};

export default nextConfig;
