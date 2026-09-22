export type AuthUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export type AuthStatus = {
  module: "auth";
  ready: boolean;
  mode: "supabase";
};

export type LogoutResponse = {
  success: boolean;
};
