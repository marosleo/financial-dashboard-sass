import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/app-config.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { InsightsModule } from "./modules/insights/insights.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    InsightsModule,
  ],
})
export class AppModule {}
