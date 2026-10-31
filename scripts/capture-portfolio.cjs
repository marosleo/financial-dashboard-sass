const { chromium } = require("@playwright/test");
const { mkdir } = require("node:fs/promises");
const { resolve } = require("node:path");

const baseUrl = process.env.PORTFOLIO_BASE_URL ?? "http://localhost:3002";
const outputDirectory = resolve(__dirname, "../docs/images");

async function main() {
  await mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1024 },
    deviceScaleFactor: 1,
  });

  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await page.waitForURL("**/dashboard");
  await page.getByRole("heading", { name: "Olá, Visitante" }).waitFor();
  await page.screenshot({
    path: resolve(outputDirectory, "dashboard.png"),
    fullPage: true,
  });

  await page.goto(`${baseUrl}/planning`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Planejamento" }).waitFor();
  await page.screenshot({
    path: resolve(outputDirectory, "planning.png"),
    fullPage: true,
  });

  await browser.close();
  console.log(`Portfolio screenshots saved to ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
