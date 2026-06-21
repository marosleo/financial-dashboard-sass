import { Controller, Get } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { InsightsService } from "./insights.service";

@Controller(API_ROUTES.insights)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get("status")
  getStatus() {
    return this.insightsService.getStatus();
  }
}

