import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/UCS503P_202627_MedmatchAI",
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
