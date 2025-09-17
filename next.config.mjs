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
  // allowedDevOrigins: [process.env.CF_TUNNEL_URL]
};

export default nextConfig;
