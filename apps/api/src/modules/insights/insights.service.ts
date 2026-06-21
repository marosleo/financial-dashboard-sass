import { Injectable } from "@nestjs/common";

@Injectable()
export class InsightsService {
  getStatus() {
    return {
      module: "insights" as const,
      ready: false,
    };
  }
}

