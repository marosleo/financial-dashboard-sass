import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  PLUGGY_CLIENT_ID: z.string().optional().default(""),
  PLUGGY_CLIENT_SECRET: z.string().optional().default(""),
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse({
    ...process.env,
    ...config,
  });
}
