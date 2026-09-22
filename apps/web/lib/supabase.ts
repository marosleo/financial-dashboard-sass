import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
);

export async function getSupabaseAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
