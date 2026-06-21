import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  getStatus() {
    return {
      module: "auth" as const,
      ready: false,
    };
  }
}

