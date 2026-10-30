export const appConfig = () => ({
  app: {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL ?? "",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    pluggyClientId: process.env.PLUGGY_CLIENT_ID ?? "",
    pluggyClientSecret: process.env.PLUGGY_CLIENT_SECRET ?? "",
    pluggyWebhookUrl: process.env.PLUGGY_WEBHOOK_URL ?? "",
    pluggyWebhookSecret: process.env.PLUGGY_WEBHOOK_SECRET ?? "",
    demoModeEnabled: process.env.DEMO_MODE_ENABLED === "true",
  },
});
