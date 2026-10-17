/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "clxrity.xyz",
      },
      {
        protocol: "https",
        hostname: "img.clxrity.xyz",
      },
      {
        protocol: "https",
        hostname: "wav.clxrity.xyz",
      },
      {
        protocol: "https",
        hostname: "os.clxrity.xyz",
      },
      {
        protocol: "https",
        hostname: "hbd.clxrity.xyz",
      },
      {
        protocol: "https",
        hostname: "mc.clxrity.xyz",
      },
    ],
  },
  redirects: async () => {
    return [
      {
        source: "/wav",
        destination: "https://wav.clxrity.xyz",
        permanent: true,
      },
      {
        source: "/os",
        destination: "https://os.clxrity.xyz",
        permanent: true,
      },
      {
        source: "/hbd",
        destination: "https://hbd.clxrity.xyz",
        permanent: true,
      },
      {
        source: "/mc",
        destination: "https://mc.clxrity.xyz",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
