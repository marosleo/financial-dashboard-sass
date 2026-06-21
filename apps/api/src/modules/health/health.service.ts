import { Injectable } from "@nestjs/common";
import type { ApiHealthResponse } from "@financial-dashboard/shared";

@Injectable()
export class HealthService {
  getStatus(): ApiHealthResponse {
    return {
      status: "ok" as const,
    };
  }
}
