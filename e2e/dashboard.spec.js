const { test, expect } = require("@playwright/test");
const { config } = require("dotenv");

config();

const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(
  ".",
)[0];
const storageKey = `sb-${projectRef}-auth-token`;
const runtimeErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  runtimeErrors.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(async ({ page }) => {
  expect(
    runtimeErrors.get(page),
    "The browser must not report console or page errors",
  ).toEqual([]);
});

const dashboard = {
  totalBalance: 14780.5,
  monthlyIncome: 7800,
  monthlyExpenses: 4250.35,
  monthlyNet: 3549.65,
  accounts: [
    {
      id: "account-1",
      institution: "Nubank",
      name: "Conta principal",
      type: "CHECKING",
      balance: 14780.5,
      currency: "BRL",
    },
  ],
  recentTransactions: [
    {
      id: "tx-1",
      description: "Supermercado",
      merchantName: "Angeloni",
      amount: -325.9,
      type: "EXPENSE",
      categorySource: "PROVIDER",
      categoryConfidence: 0.7,
      date: new Date().toISOString(),
      account: {
        id: "account-1",
        name: "Conta principal",
        institution: "Nubank",
      },
      category: {
        id: "cat-1",
        name: "Alimentação",
        color: "#76e6a2",
        icon: "restaurant",
      },
    },
    {
      id: "tx-2",
      description: "Salário",
      merchantName: "Empresa",
      amount: 7800,
      type: "INCOME",
      categorySource: "PROVIDER",
      categoryConfidence: 0.7,
      date: new Date().toISOString(),
      account: {
        id: "account-1",
        name: "Conta principal",
        institution: "Nubank",
      },
      category: {
        id: "cat-2",
        name: "Receitas",
        color: "#42c77a",
        icon: "payments",
      },
    },
  ],
  spendingByCategory: [
    {
      categoryId: "cat-1",
      categoryName: "Alimentação",
      color: "#76e6a2",
      amount: 1320,
      percentage: 31,
    },
    {
      categoryId: "cat-3",
      categoryName: "Moradia",
      color: "#8b7cf6",
      amount: 2100,
      percentage: 49,
    },
  ],
  monthlyTrends: Array.from({ length: 6 }, (_, index) => ({
    month: new Date(Date.UTC(2026, 3 + index, 1)).toISOString().slice(0, 7),
    income: 7000 + index * 120,
    expenses: 3900 + index * 80,
    net: 3100 + index * 40,
  })),
  insights: [
    {
      id: "insight-1",
      title: "Mês com saldo positivo",
      summary: "As entradas permanecem acima das saídas neste mês.",
      severity: "POSITIVE",
      period: "2026-09",
      createdAt: new Date().toISOString(),
    },
  ],
};

const integration = {
  configured: true,
  webhookConfigured: false,
  sandboxEnabled: true,
  connections: [
    {
      id: "connection-1",
      institution: "Nubank",
      status: "UPDATED",
      executionStatus: "SUCCESS",
      errorCode: null,
      errorMessage: null,
      lastSyncedAt: new Date().toISOString(),
      consentExpiresAt: null,
      accountsCount: 1,
    },
  ],
};

const planning = {
  period: new Date().toISOString().slice(0, 7),
  generatedAt: new Date().toISOString(),
  budgets: [
    {
      categoryId: "cat-1",
      categoryName: "Alimentação",
      color: "#76e6a2",
      icon: "restaurant",
      monthlyLimit: 1600,
      spent: 1320,
      percentage: 82.5,
      status: "ATTENTION",
    },
    {
      categoryId: "cat-3",
      categoryName: "Moradia",
      color: "#8b7cf6",
      icon: "home",
      monthlyLimit: 2500,
      spent: 2100,
      percentage: 84,
      status: "ATTENTION",
    },
  ],
  recurringExpenses: [
    {
      merchantKey: "imobiliaria-joinville",
      merchantName: "Imobiliária Joinville",
      averageAmount: 2100,
      occurrences: 6,
      monthsObserved: 6,
      nextExpectedDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      category: { id: "cat-3", name: "Moradia", color: "#8b7cf6" },
    },
  ],
  projection: {
    currentIncome: 7800,
    currentExpenses: 4250.35,
    projectedIncome: 7942.5,
    projectedExpenses: 4980.2,
    projectedNet: 2962.3,
    historicalExpenseAverage: 4510,
    confidence: "HIGH",
    methodology:
      "Combina o ritmo de gastos do mês (60%) com a média dos meses anteriores (40%); receitas usam o maior valor entre o realizado e a média histórica.",
  },
};

function session() {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "playwright-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "playwright-refresh-token",
    user: {
      id: "00000000-0000-4000-8000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "leonardo@example.com",
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { name: "Leonardo" },
      identities: [],
      created_at: new Date().toISOString(),
    },
  };
}

async function authenticate(page) {
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: storageKey, value: session() },
  );
}

async function mockApi(page) {
  await page.route("**/api/dashboard/categories*", (route) =>
    route.fulfill({
      json: {
        period: new Date().toISOString().slice(0, 7),
        availablePeriods: [new Date().toISOString().slice(0, 7)],
        spendingByCategory: dashboard.spendingByCategory,
      },
    }),
  );
  await page.route("**/api/dashboard", (route) =>
    route.fulfill({ json: dashboard }),
  );
  await page.route("**/api/pluggy/status", (route) =>
    route.fulfill({ json: integration }),
  );
  await page.route("**/api/planning", (route) =>
    route.fulfill({ json: planning }),
  );
  await page.route("**/api/planning/budgets/*", async (route) =>
    route.fulfill({
      json: {
        categoryId: "cat-1",
        monthlyLimit: route.request().postDataJSON().monthlyLimit,
      },
    }),
  );
  await page.route("**/api/insights/generate", (route) =>
    route.fulfill({ json: dashboard.insights }),
  );
  await page.route("**/api/transactions/categories", (route) =>
    route.fulfill({
      json: [
        dashboard.recentTransactions[0].category,
        dashboard.recentTransactions[1].category,
        { id: "cat-3", name: "Moradia", color: "#8b7cf6", icon: "home" },
      ],
    }),
  );
  await page.route("**/api/transactions/*/category", async (route) => {
    const body = route.request().postDataJSON();
    const category =
      body.categoryId === "cat-3"
        ? { id: "cat-3", name: "Moradia", color: "#8b7cf6", icon: "home" }
        : dashboard.recentTransactions[0].category;
    return route.fulfill({
      json: {
        transaction: {
          ...dashboard.recentTransactions[0],
          category,
          categorySource: "USER",
          categoryConfidence: 1,
        },
        affectedTransactions: 2,
        ruleCreated: true,
      },
    });
  });
  await page.route("**/api/transactions?**", (route) =>
    route.fulfill({
      json: {
        items: dashboard.recentTransactions,
        page: 1,
        pageSize: 15,
        total: 2,
        totalPages: 1,
      },
    }),
  );
}

test("login offers account creation, recovery and theme selection", async ({
  page,
}) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
  await expect(
    page.getByRole("heading", { name: "Bem-vindo de volta" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Criar conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Crie sua conta" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome")).toBeVisible();
  await page.getByRole("tab", { name: "Entrar" }).click();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(
    page.getByRole("heading", { name: "Recupere seu acesso" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("nexo-color-mode")))
    .toBe("light");
});

test("unauthenticated users are redirected to login", async ({ page }) => {
  for (const route of [
    "/dashboard",
    "/transactions",
    "/accounts",
    "/categories",
    "/insights",
    "/planning",
    "/settings",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Bem-vindo de volta" }),
    ).toBeVisible();
  }
});

test("portfolio demo opens read-only data without authentication", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Covered in the desktop flow");
  let demoHeader;
  await page.route("**/api/dashboard", (route) => {
    demoHeader = route.request().headers()["x-nexo-demo"];
    return route.fulfill({ json: dashboard });
  });
  await page.route("**/api/pluggy/status", (route) =>
    route.fulfill({ json: integration }),
  );

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Explorar demonstração" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Olá, Visitante" }),
  ).toBeVisible();
  await expect(
    page.getByText("Você está explorando dados fictícios"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Somente leitura" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Conectar instituição" }),
  ).toBeDisabled();
  expect(demoHeader).toBe("portfolio");
});

test("authenticated user navigates dashboard and transactions", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "The mobile flow has a dedicated layout test",
  );
  await authenticate(page);
  await mockApi(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Olá, Leonardo" }),
  ).toBeVisible();
  await expect(page.getByText("Patrimônio disponível")).toBeVisible();
  await expect(page.getByText("Nubank", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Atualizar análise" }).click();
  await expect(
    page.getByText("Análise atualizada com suas transações mais recentes."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Transações" }).first().click();
  await page.waitForURL(/\/transactions$/);
  await expect(page.getByRole("heading", { name: "Transações" })).toBeVisible();
  await expect(page.getByText("Angeloni")).toBeVisible();
  await page
    .getByPlaceholder("Buscar estabelecimento ou descrição")
    .fill("Angeloni");
  await expect(page.getByText("2 registros")).toBeVisible();
  await page.getByRole("button", { name: "Alimentação" }).click();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Moradia" }).click();
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(
    page.getByText("2 transações do mesmo estabelecimento foram atualizadas."),
  ).toBeVisible();
});

test("menus and dialogs do not move a long transactions page", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop regression only");
  await authenticate(page);
  await mockApi(page);
  await page.route("**/api/transactions?**", (route) =>
    route.fulfill({
      json: {
        items: Array.from({ length: 15 }, (_, index) => ({
          ...dashboard.recentTransactions[0],
          id: `long-transaction-${index}`,
          description: `Compra recorrente ${index + 1}`,
        })),
        page: 1,
        pageSize: 15,
        total: 15,
        totalPages: 1,
      },
    }),
  );

  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("15 registros")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.getByRole("combobox").first().click();
  await expect(page.getByRole("option", { name: "Entradas" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.keyboard.press("Escape");

  const categoryButton = page
    .getByRole("button", { name: "Alimentação" })
    .first();
  await categoryButton.scrollIntoViewIfNeeded();
  const scrollBeforeDialog = await page.evaluate(() => window.scrollY);
  const sidebar = page.locator("aside");
  await expect
    .poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().top))
    .toBe(0);

  await categoryButton.click();
  await expect(
    page.getByRole("heading", { name: "Corrigir categoria" }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBe(scrollBeforeDialog);
  await expect
    .poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().top))
    .toBe(0);
});

test("desktop sidebar opens every section and keeps the active item", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop sidebar only");
  await authenticate(page);
  await mockApi(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Olá, Leonardo" }),
  ).toBeVisible();

  const sidebar = page.locator("aside");
  const destinations = [
    { label: "Contas", route: "/accounts", heading: "Contas" },
    { label: "Categorias", route: "/categories", heading: "Categorias" },
    {
      label: "Planejamento",
      route: "/planning",
      heading: "Planejamento",
    },
    { label: "Insights", route: "/insights", heading: "Insights" },
    {
      label: "Configurações",
      route: "/settings",
      heading: "Configurações",
    },
    {
      label: "Visão geral",
      route: "/dashboard",
      heading: "Olá, Leonardo",
    },
  ];

  for (const destination of destinations) {
    await sidebar
      .getByRole("link", { name: destination.label, exact: true })
      .click();
    await expect(page).toHaveURL(destination.route);
    await expect(
      page.getByRole("heading", { name: destination.heading }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: destination.label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("section pages render financial data and actions", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Covered on desktop");
  await authenticate(page);
  await mockApi(page);

  await page.goto("/accounts");
  await expect(page.getByText("Saldos por conta")).toBeVisible();
  await expect(page.getByText("Conta principal")).toBeVisible();
  await expect(page.getByText("Patrimônio consolidado")).toBeVisible();

  await page.goto("/categories");
  await expect(page.getByText("Total categorizado")).toBeVisible();
  await expect(page.getByText("Alimentação")).toBeVisible();
  await expect(page.getByText("Moradia")).toBeVisible();

  await page.goto("/insights");
  await expect(page.getByText("Mês com saldo positivo")).toBeVisible();
  await page.getByRole("button", { name: "Atualizar análise" }).click();
  await expect(
    page.getByText("Análise atualizada com suas transações mais recentes."),
  ).toBeVisible();

  await page.goto("/settings");
  await expect(
    page.getByRole("main").getByText("leonardo@example.com"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Usar modo claro" }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("nexo-color-mode")))
    .toBe("light");

  await page.goto("/planning");
  await expect(page.getByText("Projeção do mês")).toBeVisible();
  await expect(page.getByText("Imobiliária Joinville")).toBeVisible();
  await page.getByRole("button", { name: "Editar limite" }).first().click();
  await page.getByLabel("Limite mensal").fill("1800");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Projeção do mês")).toBeVisible();
});

test("dashboard fits a mobile viewport without horizontal overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only layout assertion");
  await authenticate(page);
  await mockApi(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Olá, Leonardo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Transações" }).last(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("mobile navigation opens every available section", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile navigation only");
  await authenticate(page);
  await mockApi(page);
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: "Contas", exact: true }).click();
  await expect(page).toHaveURL("/accounts");
  await expect(page.getByRole("heading", { name: "Contas" })).toBeVisible();

  await page.getByRole("link", { name: "Planejar", exact: true }).click();
  await expect(page).toHaveURL("/planning");
  await expect(
    page.getByRole("heading", { name: "Planejamento" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Insights", exact: true }).click();
  await expect(page).toHaveURL("/insights");
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

  await page.getByRole("link", { name: "Configurações" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(
    page.getByRole("heading", { name: "Configurações" }),
  ).toBeVisible();
});

test("all authenticated pages fit the mobile viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile layout audit");
  await authenticate(page);
  await mockApi(page);

  for (const route of [
    "/dashboard",
    "/transactions",
    "/accounts",
    "/categories",
    "/insights",
    "/planning",
    "/settings",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1, h2, h3, h4").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `${route} must not overflow horizontally`,
    ).toBe(true);
  }
});
