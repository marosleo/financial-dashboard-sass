import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const DEMO_STORAGE_KEY = "nexo-demo-mode";

export type AppIdentity = {
  name: string;
  email: string;
  isDemo: boolean;
  user: User | null;
};

export function isDemoMode() {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(DEMO_STORAGE_KEY) === "true"
  );
}

export function startDemoMode() {
  window.localStorage.setItem(DEMO_STORAGE_KEY, "true");
}

export function stopDemoMode() {
  window.localStorage.removeItem(DEMO_STORAGE_KEY);
}

export async function getAppIdentity(): Promise<AppIdentity | null> {
  if (isDemoMode()) {
    return {
      name: "Visitante",
      email: "demo@nexo.app",
      isDemo: true,
      user: null,
    };
  }

  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const user = data.session.user;
  return {
    name: String(
      user.user_metadata.name ??
        user.user_metadata.full_name ??
        user.email?.split("@")[0] ??
        "Sua conta",
    ),
    email: user.email ?? "",
    isDemo: false,
    user,
  };
}

export async function endAppSession(identity: AppIdentity | null) {
  if (identity?.isDemo) {
    stopDemoMode();
    return;
  }
  await supabase.auth.signOut();
}
