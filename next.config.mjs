/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverComponentsExternalPackages: ["@google/earthengine"],
  },
  webpack: (config, { isServer }) => {
    config.externals = [...(config.externals || []), { "@google/earthengine": "commonjs @google/earthengine" }];
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "mapbox-gl": "maplibre-gl",
      };
    }
    return config;
  },
};

export default nextConfig;
