import { Injectable, UnauthorizedException } from "@nestjs/common";
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  LogoutResponse,
} from "@financial-dashboard/shared";
import { DEMO_USER_EMAIL } from "../../common/demo/demo-user";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus(): AuthStatus {
    return {
      module: "auth" as const,
      ready: true,
      mode: "demo",
    };
  }

  async login(email: string): Promise<AuthSession> {
    if (email !== DEMO_USER_EMAIL) {
      throw new UnauthorizedException("Use the seeded demo user email.");
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: DEMO_USER_EMAIL },
    });

    return {
      token: "demo-session-token",
      user: mapAuthUser(user),
    };
  }

  async getMe(): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: DEMO_USER_EMAIL },
    });

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
