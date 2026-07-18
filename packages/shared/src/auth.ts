export type AuthUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

export type DemoLoginRequest = {
  email: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthStatus = {
  module: "auth";
  ready: boolean;
  mode: "demo";
};

export type LogoutResponse = {
  success: boolean;
};
