import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    FRONTEND_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().optional().default(""),
    GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
    PLUGGY_CLIENT_ID: z.string().optional().default(""),
    PLUGGY_CLIENT_SECRET: z.string().optional().default(""),
    PLUGGY_WEBHOOK_URL: z.union([z.literal(""), z.string().url()]).default(""),
    PLUGGY_WEBHOOK_SECRET: z
      .union([
        z.literal(""),
        z.string().min(32, "PLUGGY_WEBHOOK_SECRET must have 32 characters"),
      ])
      .default(""),
    DEMO_MODE_ENABLED: z.enum(["true", "false"]).default("false"),
  })
  .superRefine((env, context) => {
    const hasClientId = Boolean(env.PLUGGY_CLIENT_ID);
    const hasClientSecret = Boolean(env.PLUGGY_CLIENT_SECRET);
    const hasWebhookUrl = Boolean(env.PLUGGY_WEBHOOK_URL);
    const hasWebhookSecret = Boolean(env.PLUGGY_WEBHOOK_SECRET);

    if (hasClientId !== hasClientSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasClientId ? ["PLUGGY_CLIENT_SECRET"] : ["PLUGGY_CLIENT_ID"],
        message:
          "PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be configured together",
      });
    }

    if (hasWebhookUrl !== hasWebhookSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasWebhookUrl
          ? ["PLUGGY_WEBHOOK_SECRET"]
          : ["PLUGGY_WEBHOOK_URL"],
        message:
          "PLUGGY_WEBHOOK_URL and PLUGGY_WEBHOOK_SECRET must be configured together",
      });
    }
  });

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse({
    ...process.env,
    ...config,
  });
}
