const requiredEnv = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
} as const;

for (const [key, value] of Object.entries(requiredEnv)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  apiUrl: requiredEnv.NEXT_PUBLIC_API_URL as string,
  supabaseUrl: requiredEnv.NEXT_PUBLIC_SUPABASE_URL as string,
  supabasePublishableKey:
    requiredEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
};
