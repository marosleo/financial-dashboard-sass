import { Controller, Get, Query } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { CategoryReportQueryDto } from "./dto/category-report-query.dto";
import { DashboardService } from "./dashboard.service";

@Controller(API_ROUTES.dashboard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get("categories")
  getCategoryReport(@Query() query: CategoryReportQueryDto) {
    return this.dashboardService.getCategoryReport(query.period);
  }
}
