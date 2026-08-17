import type { NextConfig } from "next";

const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
