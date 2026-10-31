import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { API_ROUTES } from "../../common/constants/api-routes";
import { UpsertBudgetDto } from "./dto/upsert-budget.dto";
import { PlanningService } from "./planning.service";

@Controller(API_ROUTES.planning)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get()
  getOverview() {
    return this.planningService.getOverview();
  }

  @Put("budgets/:categoryId")
  upsertBudget(
    @Param("categoryId") categoryId: string,
    @Body() body: UpsertBudgetDto,
  ) {
    return this.planningService.upsertBudget(categoryId, body.monthlyLimit);
  }
}
