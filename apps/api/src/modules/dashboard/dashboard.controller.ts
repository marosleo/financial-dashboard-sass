import { Controller, Get } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { DashboardService } from "./dashboard.service";

@Controller(API_ROUTES.dashboard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getOverview() {
    return this.dashboardService.getOverview();
  }
}

