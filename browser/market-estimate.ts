// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

/** Walks the supplied calculator against the real shop, including a bounded deliberate outage. */
export async function exerciseMarketEstimate(
  page: Page,
  shop: string,
  info: TestInfo,
): Promise<void> {
  const errors: string[] = [];
  const consoleProblems: string[] = [];
  const failedRequests: string[] = [];
  const failedResponses: Array<{ url: string; status: number }> = [];
  const quotes: string[] = [];
  const posts: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      (message.type() === "error" || message.type() === "warning") &&
      !message.location().url.endsWith("/favicon.ico")
    )
      consoleProblems.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico"))
      failedResponses.push({ url: response.url(), status: response.status() });
  });
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
    if (request.url() === `${shop}/api/quote`) quotes.push(request.url());
  });
  await page.goto(`${shop}/p/kb-guji-250?grind=Espresso`);
  const basketLink = page.locator("basket-count").getByRole("link", { name: "Basket, 0 in it" });
  await expect(basketLink).toBeVisible();
  const calculator = page.locator('assembly-root[data-name="price-calculator"]');
  await calculator.scrollIntoViewIfNeeded();
  await expect(calculator).toHaveAttribute("data-mounted", "");
  await expect(calculator.getByRole("heading", { name: "Order estimate" })).toBeVisible();
  const quantity = calculator.getByLabel("Quantity to estimate");
  const result = calculator.getByRole("status");
  for (const amount of [1, 3, 6]) {
    const response = page.waitForResponse((response) => response.url() === `${shop}/api/quote`);
    if (amount === 1) {
      await quantity.focus();
      await page.keyboard.press("Tab");
      await expect(calculator.getByRole("button", { name: "1 item", exact: true })).toBeFocused();
      await page.keyboard.press("Space");
    } else {
      await calculator.getByRole("button", { name: `${amount} items`, exact: true }).click();
    }
    const returned = await response;
    expect(returned.status()).toBe(200);
    expect(returned.request().postDataJSON()).toEqual({
      lines: [{ sku: "kb-guji-250", quantity: amount, note: "Espresso" }],
    });
    const priced = (await returned.json()) as { cents: number };
    await expect(result).toHaveText(`Estimate for ${amount}: $${(priced.cents / 100).toFixed(2)}`);
    await expect(quantity).toHaveValue(String(amount));
  }
  await quantity.fill("99");
  await calculator.getByRole("button", { name: "Get estimate" }).click();
  await expect(calculator.getByRole("alert")).toContainText("Only 14");
  await expect(basketLink).toBeVisible();
  const beforeInvalid = quotes.length;
  await quantity.fill("0");
  await calculator.getByRole("button", { name: "Get estimate" }).click();
  expect(
    await quantity.evaluate((input) => (input as HTMLInputElement).validity.rangeUnderflow),
  ).toBe(true);
  expect(quotes).toHaveLength(beforeInvalid);
  await expect(result).not.toContainText("Estimate for");

  await quantity.fill("4");
  await page.route(
    "**/api/quote",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"error":"deliberate quote outage"}',
      }),
    { times: 1 },
  );
  await calculator.getByRole("button", { name: "Get estimate" }).click();
  await expect(calculator.getByRole("alert")).toContainText("Quote request failed (503)");
  await expect(quantity).toHaveValue("4");
  await expect(result).not.toContainText("Estimate for");
  await calculator.getByRole("button", { name: "Get estimate" }).click();
  await expect(result).toContainText("Estimate for 4:");
  await expect(calculator.getByRole("alert")).toHaveCount(0);
  await calculator.screenshot({ path: info.outputPath("market-estimate-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await calculator.scrollIntoViewIfNeeded();
  const box = await calculator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
  expect(await calculator.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
    true,
  );
  await calculator.screenshot({ path: info.outputPath("market-estimate-narrow.png") });
  await page.emulateMedia({ colorScheme: "dark" });
  await calculator.screenshot({ path: info.outputPath("market-estimate-dark.png") });
  await expect(basketLink).toBeVisible();
  expect(posts).toEqual(Array(quotes.length).fill(`${shop}/api/quote`));
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(failedResponses).toEqual([{ url: `${shop}/api/quote`, status: 503 }]);
  expect(consoleProblems.length).toBeLessThanOrEqual(1);
  for (const message of consoleProblems)
    expect(message).toBe(
      "Failed to load resource: the server responded with a status of 503 (Service Unavailable)",
    );
}
