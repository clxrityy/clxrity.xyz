/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.clxrity.xyz"
            }
        ]
    }
}

module.exports = nextConfig;
