/** @type {import('next').NextConfig} */
const renderBackendUrl = process.env.RENDER_BACKEND_URL;

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  async rewrites() {
    if (renderBackendUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${renderBackendUrl.replace(/\/$/, "")}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

