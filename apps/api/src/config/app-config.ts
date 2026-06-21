export const appConfig = () => ({
  app: {
    port: Number(process.env.PORT ?? 3001),
    nodeEnv: process.env.NODE_ENV ?? "development",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    databaseUrl: process.env.DATABASE_URL ?? "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    pluggyClientId: process.env.PLUGGY_CLIENT_ID ?? "",
    pluggyClientSecret: process.env.PLUGGY_CLIENT_SECRET ?? "",
  },
});
