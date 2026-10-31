import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/app-config.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { HealthModule } from "./modules/health/health.module";
import { InsightsModule } from "./modules/insights/insights.module";
import { PluggyModule } from "./modules/pluggy/pluggy.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { AuthContextModule } from "./common/auth/auth-context.module";
import { PlanningModule } from "./modules/planning/planning.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthContextModule,
    HealthModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    PluggyModule,
    InsightsModule,
    DashboardModule,
    PlanningModule,
  ],
})
export class AppModule {}
