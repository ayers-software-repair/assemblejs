// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("workspace uses saved source and actual composed Market servers", async ({ page }, info) => {
  test.setTimeout(150000);
  const fixture = await serveModes("workspace");
  const errors: string[] = [];
  const failures: Array<{ url: string; error: string; phase: string }> = [];
  const responses: Array<{ url: string; status: number }> = [];
  let phase = "initial";
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failures.push({ url: request.url(), error: request.failure()?.errorText ?? "", phase }),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      responses.push({ url: response.url(), status: response.status() });
  });
  try {
    const parentResponse = await page.goto(`${fixture.origin}/?workspace`);
    expect(parentResponse?.headers()["content-security-policy"]).toContain(
      `frame-src ${fixture.runtime.origin}`,
    );
    const status = page.getByRole("status", { name: "Workspace status", exact: true });
    const editor = page.getByRole("region", { name: "Project code", exact: true });
    const guided = page.getByRole("region", { name: "Guided calculator", exact: true });
    const mode = guided.getByRole("combobox", { name: "Agent mode" });
    const input = editor.getByRole("textbox", { name: "Source code" });
    const build = page.getByRole("button", { name: "Check & preview", exact: true });
    const preview = page.frameLocator('iframe[title="Application preview"]');
    const calculator = preview.locator('assembly-root[data-name="price-calculator"]');
    await expect(input).toHaveValue(fixture.calculatorSource("product.html"));
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    await expect(preview.locator("assembly-root")).toHaveCount(12);
    await expect(preview.locator("assembly-root[data-failed]")).toHaveCount(0);
    await expect(preview.locator("assembly-root[data-remote]")).toHaveCount(6);
    expect(
      await preview.locator("body").evaluate(() => {
        try {
          void parent.document.body;
          return "accessible";
        } catch (error) {
          return error instanceof DOMException ? error.name : String(error);
        }
      }),
    ).toBe("SecurityError");
    const framed = await fetch(`${fixture.runtime.origin}/p/kb-guji-250`);
    expect(framed.headers.get("content-security-policy")).toContain(
      `frame-ancestors 'self' ${fixture.origin}`,
    );
    const refused = await fetch(`${fixture.origin}/call-tool`, {
      method: "POST",
      headers: { Origin: fixture.runtime.origin, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "check" }),
    });
    expect(refused.status).toBe(403);
    const before = fixture.calculatorSource("product.html");
    await guided.getByRole("button", { name: "Plan changes", exact: true }).click();
    await expect(guided.getByRole("status")).toHaveText("Plan ready. No files written.");
    expect(fixture.calculatorSource("product.html")).toBe(before);
    expect(fixture.runtime.builds()).toHaveLength(4);
    await expect(page.locator("iframe")).toHaveCount(1);
    await mode.selectOption("approval");
    await guided.getByRole("button", { name: "Reject proposal", exact: true }).click();
    await guided
      .getByRole("button", { name: 'Add a calculator called "Coffee total"', exact: true })
      .click();
    await guided.getByRole("button", { name: "Propose changes", exact: true }).click();
    await expect(guided.getByRole("status")).toHaveText("Plan ready. No files written.");
    phase = "approved-source-change";
    await guided.getByRole("button", { name: "Approve changes", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("project check passed");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(input).toHaveValue(fixture.calculatorSource("product.html"));
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 45000 });
    await expect(preview.locator("assembly-root")).toHaveCount(13);
    await expect(calculator).toHaveAttribute("data-mounted", "");
    await expect(calculator.getByRole("heading", { name: "Coffee total" })).toBeVisible();
    const quote = page.waitForResponse(
      (response) => response.url() === `${fixture.runtime.origin}/api/quote`,
    );
    await calculator.getByRole("button", { name: "3 items", exact: true }).click();
    const quoted = await quote;
    expect(quoted.status()).toBe(200);
    expect(quoted.request().postDataJSON().lines[0].quantity).toBe(3);
    const priced = (await quoted.json()) as { cents: number };
    await expect(calculator.getByRole("status")).toHaveText(
      `Estimate for 3: $${(priced.cents / 100).toFixed(2)}`,
    );
    await expect(preview.getByRole("link", { name: "Basket, 0 in it" })).toBeVisible();
    await editor
      .getByRole("navigation", { name: "Project files" })
      .getByRole("button", {
        name: "src/assemblies/price-calculator/price-calculator.react.tsx",
        exact: true,
      })
      .click();
    await expect(input).toHaveValue(fixture.calculatorSource("price-calculator.react.tsx"));
    const manual = fixture
      .calculatorSource("price-calculator.react.tsx")
      .replaceAll("Coffee total", "Manual estimate");
    await input.fill(manual);
    phase = "manual-source-change";
    await editor.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(editor.getByRole("status")).toContainText("Saved");
    await expect(page.locator("iframe")).toHaveCount(0);
    await mode.selectOption("auto");
    await guided.getByRole("button", { name: "Use presets 2, 4, 8", exact: true }).click();
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("project check passed");
    await expect(input).toHaveValue(fixture.calculatorSource("price-calculator.react.tsx"));
    expect(await input.inputValue()).toContain("Manual estimate");
    expect(await input.inputValue()).toContain("[2, 4, 8].map");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 45000 });
    await expect(calculator).toHaveAttribute("data-mounted", "");
    await expect(calculator.getByRole("heading", { name: "Manual estimate" })).toBeVisible();
    await expect(calculator.getByRole("button", { name: "4 items", exact: true })).toBeVisible();
    await expect(calculator.getByRole("button", { name: "3 items", exact: true })).toHaveCount(0);
    await expect(preview.locator("assembly-root[data-failed]")).toHaveCount(0);
    await input.press("Control+Home");
    await input.press("Tab");
    await expect(editor.getByRole("button", { name: "Reload file", exact: true })).toBeFocused();
    await page
      .locator('iframe[title="Application preview"]')
      .scrollIntoViewIfNeeded({ timeout: 10000 });
    await expect(page.locator('iframe[title="Application preview"]')).toBeInViewport({
      ratio: 0.9,
    });
    await calculator.scrollIntoViewIfNeeded({ timeout: 10000 });
    await page.screenshot({ path: info.outputPath("workspace-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator('iframe[title="Application preview"]')
      .scrollIntoViewIfNeeded({ timeout: 10000 });
    await expect(page.locator('iframe[title="Application preview"]')).toBeInViewport({
      ratio: 0.9,
    });
    await calculator.scrollIntoViewIfNeeded({ timeout: 10000 });
    const finalQuote = page.waitForResponse(
      (response) => response.url() === `${fixture.runtime.origin}/api/quote`,
    );
    await calculator.getByRole("button", { name: "4 items", exact: true }).click();
    const finalPriced = await finalQuote;
    expect(finalPriced.status()).toBe(200);
    expect(finalPriced.request().postDataJSON().lines[0].quantity).toBe(4);
    await expect(calculator.getByRole("status")).toHaveText(
      `Estimate for 4: $${(((await finalPriced.json()) as { cents: number }).cents / 100).toFixed(2)}`,
    );
    await expect(preview.getByRole("link", { name: "Basket, 0 in it" })).toBeVisible();
    const layout = await preview.locator("html").evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollLeft: element.scrollLeft,
      windowScrollX: window.scrollX,
      outside: [...element.querySelectorAll("body *")].flatMap((node) => {
        const box = node.getBoundingClientRect();
        if (!box.width || (box.left >= -1 && box.right <= element.clientWidth + 1)) return [];
        const style = getComputedStyle(node);
        return [
          {
            tag: node.tagName,
            class: node.getAttribute("class"),
            assembly: node.closest("assembly-root")?.getAttribute("data-name"),
            left: box.left,
            right: box.right,
            width: box.width,
            minWidth: style.minWidth,
            display: style.display,
            text: node.textContent?.slice(0, 80),
          },
        ];
      }),
    }));
    await writeFile(
      info.outputPath("workspace-narrow-layout.json"),
      JSON.stringify(layout, null, 2),
    );
    await page.screenshot({ path: info.outputPath("workspace-narrow-before-layout-check.png") });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    await page
      .locator('iframe[title="Application preview"]')
      .scrollIntoViewIfNeeded({ timeout: 10000 });
    await expect(page.locator('iframe[title="Application preview"]')).toBeInViewport({
      ratio: 0.9,
    });
    await calculator.scrollIntoViewIfNeeded({ timeout: 10000 });
    await page.screenshot({ path: info.outputPath("workspace-narrow.png") });
    await page.screenshot({ path: info.outputPath("workspace-narrow-layout.png"), fullPage: true });
    phase = "stop";
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(status).toHaveText("Preview stopped. Your source is kept.");
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(fixture.runtime.active()).toEqual([]);
    expect(fixture.runtime.builds()).toHaveLength(6);
    expect(fixture.runtime.builds().every((record: { ok: boolean }) => record.ok)).toBe(true);
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toContain("Manual estimate");
    await expect(fetch(fixture.runtime.origin)).rejects.toThrow();
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
    // Removing a live preview may abort its one owned stock EventSource request.
    expect(failures.length).toBeLessThanOrEqual(3);
    for (const failure of failures) {
      expect(failure.url).toBe(`${fixture.runtime.origin}/api/stock`);
      expect(failure.error).toBe("net::ERR_ABORTED");
      expect(["approved-source-change", "manual-source-change", "stop"]).toContain(failure.phase);
    }
    expect(new Set(failures.map((failure) => failure.phase)).size).toBe(failures.length);
  } finally {
    try {
      await writeFile(
        info.outputPath("workspace-evidence.json"),
        JSON.stringify(
          {
            errors,
            failures,
            responses,
            calls: fixture.calls,
            builds: fixture.runtime.builds(),
            active: fixture.runtime.active(),
          },
          null,
          2,
        ),
      );
    } finally {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    }
    expect(fixture.runtime.active()).toEqual([]);
  }
});

test("closing the workspace aborts and reaps an actual in-flight CLI build", async ({
  request,
}, info) => {
  const fixture = await serveModes("workspace");
  const building = request
    .post(`${fixture.origin}/preview`, {
      headers: { Origin: fixture.origin },
      data: {},
    })
    .then(
      async (response) => ({ completed: response.ok(), body: await response.text() }),
      (error: unknown) => ({ completed: false, error: String(error) }),
    );
  try {
    await expect.poll(() => fixture.runtime.active().length).toBeGreaterThan(0);
  } finally {
    await fixture.close();
  }
  const result = await building;
  expect(result.completed).toBe(false);
  expect(fixture.runtime.active()).toEqual([]);
  await writeFile(
    info.outputPath("workspace-build-cancellation.json"),
    JSON.stringify(
      {
        result,
        builds: fixture.runtime.builds(),
        active: fixture.runtime.active(),
      },
      null,
      2,
    ),
  );
});
