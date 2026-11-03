import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { z } from "zod";
import { AuthContextService } from "../../common/auth/auth-context.service";
import { mapInsight } from "../../common/mappers/financial.mapper";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppConfigService } from "../../config/app-config.service";

const generatedInsightsSchema = z.object({
  insights: z
    .array(
      z.object({
        title: z.string().min(1).max(90),
        summary: z.string().min(1).max(420),
        severity: z.enum(["INFO", "WARNING", "POSITIVE"]),
      }),
    )
    .min(1)
    .max(3),
});

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly auth: AuthContextService,
  ) {}

  getStatus() {
    return { configured: this.config.isGeminiConfigured };
  }

  async list() {
    const user = await this.auth.getUser();
    return this.listForUser(user.id);
  }

  async refreshForUser(userId: string) {
    if (!this.config.isGeminiConfigured) return false;
    await this.generateForUser(userId);
    return true;
  }

  async generate() {
    if (!this.config.isGeminiConfigured) {
      throw new ServiceUnavailableException(
        "Configure GEMINI_API_KEY to generate AI insights.",
      );
    }

    const user = await this.auth.getUser();
    return this.generateForUser(user.id);
  }

  private async listForUser(userId: string) {
    const insights = await this.prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return insights.map(mapInsight);
  }

  private async generateForUser(userId: string) {
    const period = new Date().toISOString().slice(0, 7);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        status: "POSTED",
        date: { gte: new Date(`${period}-01T00:00:00.000Z`) },
      },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 250,
    });

    const normalizedTransactions = transactions.map((transaction) => ({
      date: transaction.date.toISOString().slice(0, 10),
      description: transaction.description,
      amount: transaction.amount.toNumber(),
      type: transaction.type,
      category: transaction.category?.name ?? "Sem categoria",
    }));

    const content = await this.requestInsights(normalizedTransactions);
    const generated = content
      ? parseGeneratedInsights(content)
      : createFallbackInsights(normalizedTransactions);

    await this.prisma.$transaction([
      this.prisma.insight.deleteMany({
        where: { userId, period: { in: [period, "current-month"] } },
      }),
      this.prisma.insight.createMany({
        data: generated.insights.map((insight) => ({
          ...insight,
          userId,
          period,
        })),
      }),
    ]);

    return this.listForUser(userId);
  }

  private async requestInsights(transactions: unknown[]) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.config.geminiModel}:generateContent?key=${this.config.geminiApiKey}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: "You are a careful Brazilian personal-finance analyst. Never give investment, legal, or tax advice. Use Brazilian Portuguese. Return only valid JSON.",
                  },
                ],
              },
              generationConfig: {
                maxOutputTokens: 2_000,
                responseMimeType: "application/json",
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Describe the spending records below. Do not give investment, credit, legal, tax, or individualized financial advice. Return only valid JSON in this exact shape: {"insights":[{"title":"...","summary":"...","severity":"INFO|WARNING|POSITIVE"}]}. Include one to three observations about expenses, income, or recurring charges. Records: ${JSON.stringify(transactions)}`,
                    },
                  ],
                },
              ],
            }),
          },
        );
      } catch {
        if (attempt < 2) {
          await wait(600 * (attempt + 1));
          continue;
        }
        this.logger.warn(
          "Gemini could not be reached; using the local insight engine.",
        );
        return null;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { status?: string };
        } | null;
        const transient = response.status === 429 || response.status >= 500;
        if (transient && attempt < 2) {
          await wait(600 * (attempt + 1));
          continue;
        }
        if (transient) {
          this.logger.warn(
            `Gemini returned HTTP ${response.status}; using the local insight engine.`,
          );
          return null;
        }
        throw new BadGatewayException(
          getGeminiErrorMessage(response.status, body?.error?.status),
        );
      }

      const body = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n");
      if (!text) {
        this.logger.warn(
          "Gemini returned no content; using the local insight engine.",
        );
        return null;
      }
      return text;
    }

    return null;
  }
}

function getGeminiErrorMessage(status: number, providerStatus?: string) {
  if (
    providerStatus === "API_KEY_INVALID" ||
    status === 401 ||
    status === 403
  ) {
    return "Gemini rejected the configured API key.";
  }
  if (status === 400 || status === 404) {
    return "Gemini rejected the configured model or request format.";
  }
  if (status === 429) {
    return "Gemini's free-tier quota was reached. Try again later.";
  }
  return `Gemini could not generate insights (HTTP ${status}).`;
}

function parseGeneratedInsights(text: string) {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) {
    throw new BadGatewayException(
      "Gemini returned an invalid insight response.",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new BadGatewayException(
      "Gemini returned an invalid insight response.",
    );
  }
  const parsed = generatedInsightsSchema.safeParse(value);
  if (!parsed.success) {
    throw new BadGatewayException("Gemini returned invalid insight data.");
  }
  return parsed.data;
}

type NormalizedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
};

export function createFallbackInsights(transactions: NormalizedTransaction[]) {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "EXPENSE",
  );
  const income = transactions.filter(
    (transaction) => transaction.type === "INCOME",
  );
  const totalExpenses = expenses.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  );
  const totalIncome = income.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  );
  const categories = new Map<string, number>();
  for (const transaction of expenses) {
    categories.set(
      transaction.category,
      (categories.get(transaction.category) ?? 0) +
        Math.abs(transaction.amount),
    );
  }
  const [largestCategory, largestCategoryAmount] = [
    ...categories.entries(),
  ].sort((a, b) => b[1] - a[1])[0] ?? ["Sem categoria", 0];
  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const insights: Array<{
    title: string;
    summary: string;
    severity: "INFO" | "WARNING" | "POSITIVE";
  }> = [];
  if (transactions.length === 0) {
    insights.push({
      title: "Conecte suas movimentações",
      summary:
        "Sincronize uma conta para receber análises baseadas no seu histórico financeiro.",
      severity: "INFO",
    });
  } else {
    insights.push({
      title:
        totalIncome >= totalExpenses
          ? "Mês com saldo positivo"
          : "Saídas acima das entradas",
      summary: `As entradas somam ${formatter.format(totalIncome)} e as saídas ${formatter.format(totalExpenses)} neste mês.`,
      severity: totalIncome >= totalExpenses ? "POSITIVE" : "WARNING",
    });
    if (largestCategoryAmount > 0) {
      insights.push({
        title: `${largestCategory} lidera os gastos`,
        summary: `${formatter.format(largestCategoryAmount)} foram destinados a esta categoria, equivalente a ${Math.round((largestCategoryAmount / Math.max(totalExpenses, 1)) * 100)}% das saídas.`,
        severity: "INFO",
      });
    }
    insights.push({
      title: `${transactions.length} movimentações analisadas`,
      summary: `A análise considerou ${expenses.length} saídas e ${income.length} entradas registradas no período atual.`,
      severity: "INFO",
    });
  }

  return generatedInsightsSchema.parse({ insights: insights.slice(0, 3) });
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
