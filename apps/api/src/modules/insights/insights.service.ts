import { Injectable } from "@nestjs/common";
import { DEMO_USER_EMAIL } from "../../common/demo/demo-user";
import { mapInsight } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class InsightsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: DEMO_USER_EMAIL },
    });

    const insights = await this.prisma.insight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return insights.map(mapInsight);
  }
}
