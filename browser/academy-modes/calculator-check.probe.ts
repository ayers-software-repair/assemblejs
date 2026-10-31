// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("saved calculator verification uses real output and quotes, refuses races and bad prices, then recovers", async ({
  page,
}, info) => {
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
  const post = (body: unknown, origin = fixture.origin) =>
    fetch(`${fixture.origin}/preview-inspect`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  try {
    await page.goto(`${fixture.origin}/?workspace`);
    const status = page.getByRole("status", { name: "Workspace status", exact: true });
    const build = page.getByRole("button", { name: "Check & preview", exact: true });
    const verify = page.getByRole("button", { name: "Verify calculator", exact: true });
    const guided = page.getByRole("region", { name: "Guided calculator", exact: true });
    const editor = page.getByRole("region", { name: "Project code", exact: true });
    const input = editor.getByRole("textbox", { name: "Source code", exact: true });
    const diagnostics = page.locator(".academy-application-preview details pre");
    await expect(input).toHaveValue(fixture.calculatorSource("product.html"));
    await expect(verify).toBeDisabled();
    expect((await post({ values: [1] }, fixture.runtime.origin)).status).toBe(403);
    expect((await post({ values: [1], url: "https://unrelated.example" })).status).toBe(400);
    expect((await post({ values: [1] })).status).toBe(400);
    expect(fixture.runtime.inspections()).toEqual([]);
    await guided.getByRole("combobox", { name: "Agent mode" }).selectOption("auto");
    await guided
      .getByRole("textbox", { name: "Calculator request", exact: true })
      .fill('Add a calculator called "Check total"');
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("project check passed");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    const preview = page.frameLocator('iframe[title="Application preview"]');
    await expect(preview.getByRole("heading", { name: "Check total", exact: true })).toBeVisible();
    const writes = () =>
      fixture.calls.filter((call: { name: string }) => call.name === "apply_source_changes").length;
    const checks = () =>
      fixture.calls.filter((call: { name: string }) => call.name === "check").length;
    const before = { writes: writes(), checks: checks(), builds: fixture.runtime.builds().length };
    await verify.focus();
    await verify.press("Enter");
    await expect(status).toContainText("Saved calculator output and quotes verified for revision");
    expect(writes()).toBe(before.writes);
    expect(checks()).toBe(before.checks);
    expect(fixture.runtime.builds()).toHaveLength(before.builds);
    const evidence = JSON.parse((await diagnostics.textContent()) ?? "{}");
    expect(evidence.version).toMatch(/^[a-f0-9]{12}$/);
    expect(evidence.title).toBe("Check total");
    expect(
      evidence.quotes.map((quote: { quantity: number; cents: number }) => [
        quote.quantity,
        quote.cents,
      ]),
    ).toEqual([
      [1, 1600],
      [3, 4800],
      [6, 9600],
    ]);
    expect(fixture.runtime.inspections()).toHaveLength(1);
    await expect(verify).toBeFocused();
    await page.screenshot({
      path: info.outputPath("calculator-verified-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await verify.scrollIntoViewIfNeeded();
    await expect(verify).toBeInViewport();
    await page.screenshot({ path: info.outputPath("calculator-verified-narrow.png") });
    await page.setViewportSize({ width: 1280, height: 900 });
    phase = "inspection-race";
    await page.route("**/preview-inspect", async (route) => {
      const reply = await route.fetch();
      fixture.outside("inspection-edit", "<p>Outside inspection edit stays.</p>");
      await route.fulfill({ response: reply });
    });
    await verify.click();
    await expect(status).toContainText("Calculator check failed");
    await expect(diagnostics).toContainText("no longer matches this preview");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(verify).toBeDisabled();
    expect(writes()).toBe(before.writes);
    expect(fixture.source("inspection-edit")).toBe("<p>Outside inspection edit stays.</p>");
    await page.getByText("Build diagnostics", { exact: true }).click();
    await page.screenshot({ path: info.outputPath("calculator-check-stale.png"), fullPage: true });
    await page.unroute("**/preview-inspect");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    await verify.click();
    await expect(status).toContainText("Saved calculator output and quotes verified");
    phase = "bad-api";
    await editor
      .getByRole("navigation", { name: "Project files" })
      .getByRole("button", { name: "src/api/quote.api.ts", exact: true })
      .click();
    await expect(input).toHaveValue(/quote\(asked\(body\)\)/);
    const original = await input.inputValue();
    const bad = original.replace(
      "quote(asked(body))",
      "({ ...(await quote(asked(body))), cents: 1 })",
    );
    expect(bad).not.toBe(original);
    await input.fill(bad);
    await editor.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(editor.getByRole("status")).toContainText("Saved");
    await expect(verify).toBeDisabled();
    await expect(status).not.toContainText("verified for revision");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    await verify.click();
    await expect(status).toContainText("Calculator check failed");
    await expect(diagnostics).toContainText("Quote evidence for quantity 1 is invalid");
    await expect(diagnostics).toContainText('"cents":1,');
    await page.screenshot({
      path: info.outputPath("calculator-check-bad-quote.png"),
      fullPage: true,
    });
    phase = "recovery";
    await input.fill(original);
    await editor.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(editor.getByRole("status")).toContainText("Saved");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    await verify.click();
    await expect(status).toContainText("Saved calculator output and quotes verified");
    expect(writes()).toBe(before.writes + 2);
    expect(fixture.runtime.inspections()).toHaveLength(5);
    expect(fixture.runtime.builds()).toHaveLength(7);
    expect(fixture.runtime.builds().every((record: { ok: boolean }) => record.ok)).toBe(true);
    expect(fixture.source("inspection-edit")).toBe("<p>Outside inspection edit stays.</p>");
    phase = "stop";
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(status).toHaveText("Preview stopped. Your source is kept.");
    await expect(verify).toBeDisabled();
    expect(fixture.runtime.active()).toEqual([]);
    expect((await post({ values: [1] })).status).toBe(400);
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
    expect(failures.length).toBeLessThanOrEqual(4);
    for (const failure of failures) {
      expect(failure.url).toBe(`${fixture.runtime.origin}/api/stock`);
      expect(failure.error).toBe("net::ERR_ABORTED");
      expect(["inspection-race", "bad-api", "recovery", "stop"]).toContain(failure.phase);
    }
  } finally {
    try {
      await writeFile(
        info.outputPath("calculator-check-evidence.json"),
        JSON.stringify(
          {
            errors,
            failures,
            responses,
            calls: fixture.calls,
            builds: fixture.runtime.builds(),
            inspections: fixture.runtime.inspections(),
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
