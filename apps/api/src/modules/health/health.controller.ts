import { Controller, Get } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { HealthService } from "./health.service";

@Controller(API_ROUTES.health)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  health() {
    return this.healthService.getStatus();
  }
}
