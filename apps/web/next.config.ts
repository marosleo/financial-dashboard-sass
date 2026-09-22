import { config } from "dotenv";
import type { NextConfig } from "next";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
