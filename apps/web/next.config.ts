import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(projectDirectory, "../../.env");

if (existsSync(rootEnvPath)) loadEnvFile(rootEnvPath);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  output: "standalone",
  outputFileTracingRoot: resolve(projectDirectory, "../.."),
};

export default nextConfig;
