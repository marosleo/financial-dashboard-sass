import { Injectable } from "@nestjs/common";
import type {
  AuthStatus,
  AuthUser,
  LogoutResponse,
} from "@financial-dashboard/shared";
import { AuthContextService } from "../../common/auth/auth-context.service";

@Injectable()
export class AuthService {
  constructor(private readonly auth: AuthContextService) {}

  getStatus(): AuthStatus {
    return {
      module: "auth" as const,
      ready: true,
      mode: "supabase",
    };
  }

  async getMe(): Promise<AuthUser> {
    const user = await this.auth.getUser();
    return mapAuthUser(user);
  }

  logout(): LogoutResponse {
    return { success: true };
  }
}

function mapAuthUser(user: {
  id: string;
  name: string;
  email: string;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}
