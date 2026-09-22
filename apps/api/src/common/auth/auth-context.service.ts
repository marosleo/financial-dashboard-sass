import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaService } from "../prisma/prisma.service";

export type AuthIdentity = {
  id: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthContextService {
  private readonly storage = new AsyncLocalStorage<AuthIdentity>();

  constructor(private readonly prisma: PrismaService) {}

  run(identity: AuthIdentity, next: () => void) {
    this.storage.run(identity, next);
  }

  getIdentity() {
    const identity = this.storage.getStore();
    if (!identity) throw new UnauthorizedException("Authentication required.");
    return identity;
  }

  async getUser() {
    const identity = this.getIdentity();
    return this.prisma.user.upsert({
      where: { email: identity.email },
      create: { id: identity.id, email: identity.email, name: identity.name },
      update: { name: identity.name },
    });
  }
}
