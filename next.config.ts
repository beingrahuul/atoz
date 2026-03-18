import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix Next.js 16 build crash since we have webpack but no turbopack config setup
  serverExternalPackages: ['sharp', 'onnxruntime-node'],

  turbopack: {
    resolveAlias: {
      "sharp$": "",
      "onnxruntime-node$": "",
    }
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    return config;
  },
};

export default nextConfig;
