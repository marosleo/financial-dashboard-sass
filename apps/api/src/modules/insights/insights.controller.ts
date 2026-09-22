import { Controller, Get, Post } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { InsightsService } from "./insights.service";

@Controller(API_ROUTES.insights)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  list() {
    return this.insightsService.list();
  }

  @Get("status")
  getStatus() {
    return this.insightsService.getStatus();
  }

  @Post("generate")
  generate() {
    return this.insightsService.generate();
  }
}
