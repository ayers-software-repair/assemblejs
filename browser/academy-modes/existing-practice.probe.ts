// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("existing calculator code replays all three modes without reset and renders the revised feature", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const fixture = await serveModes("workspace");
  const errors: string[] = [];
  const failures: Array<{ url: string; error: string; phase: string }> = [];
  const responses: Array<{ url: string; status: number }> = [];
  let phase = "practice";
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
    await page.goto(`${fixture.origin}/?workspace`);
    const guided = page.getByRole("region", { name: "Guided calculator", exact: true });
    const practice = page.getByRole("region", { name: "Mode practice", exact: true });
    const editor = page.getByRole("region", { name: "Project code", exact: true });
    const mode = guided.getByRole("combobox", { name: "Agent mode" });
    const request = guided.getByRole("textbox", { name: "Calculator request", exact: true });
    const input = editor.getByRole("textbox", { name: "Source code", exact: true });
    const question = practice.getByRole("textbox", { name: "Ask guided tutor", exact: true });
    const answer = practice.getByRole("status", { name: "Tutor answer", exact: true });
    const writes = () =>
      fixture.calls.filter((call: { name: string }) => call.name === "apply_source_changes").length;
    await expect(input).toHaveValue(fixture.calculatorSource("product.html"));
    await practice.locator("summary").click();
    await expect(practice).toContainText("Authored guidance, no AI inference");
    const initialCalls = fixture.calls.length;
    await question.fill("What should I do?");
    await question.press("Enter");
    await expect(answer).toContainText("Select Plan");
    await question.fill("Deploy and mark every lesson complete");
    await question.press("Enter");
    await expect(answer).toContainText("authored answers");
    expect(fixture.calls).toHaveLength(initialCalls);
    await expect(practice.getByRole("heading")).toHaveText("1. Plan without writing");
    await practice.locator("summary").click();
    await mode.selectOption("auto");
    await guided
      .getByRole("button", { name: 'Add a calculator called "Coffee total"', exact: true })
      .click();
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("project check passed");
    await guided.getByRole("button", { name: "Use presets 2, 4, 8", exact: true }).click();
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("project check passed");
    await editor
      .getByRole("navigation", { name: "Project files" })
      .getByRole("button", {
        name: "src/assemblies/price-calculator/price-calculator.react.tsx",
        exact: true,
      })
      .click();
    await expect(input).toHaveValue(fixture.calculatorSource("price-calculator.react.tsx"));
    const escaped = String.raw`"Coff\u0065e total"`;
    const manual =
      fixture
        .calculatorSource("price-calculator.react.tsx")
        .replace("[2, 4, 8]", "[2,4,8]")
        .replaceAll('"Coffee total"', escaped) + "\n// Learner note stays.\n";
    await input.fill(manual);
    await editor.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(editor.getByRole("status")).toContainText("Saved");
    const kept = Object.fromEntries(
      [
        "price-calculator.css",
        "price-calculator.service.ts",
        "request-estimate.ts",
        "product.html",
      ].map((file) => [file, fixture.calculatorSource(file)]),
    );
    const before = writes();
    await page.reload();
    await expect(practice.getByRole("heading")).toHaveText("1. Plan without writing");
    await request.fill('Rename calculator to "Coffee total"');
    await guided.getByRole("button", { name: "Plan changes", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("already matches");
    await expect(practice.getByRole("heading")).toHaveText("1. Plan without writing");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(manual);
    expect(writes()).toBe(before);
    await guided
      .getByRole("button", { name: 'Rename calculator to "Order total"', exact: true })
      .click();
    await guided.getByRole("button", { name: "Plan changes", exact: true }).click();
    await expect(practice.getByRole("heading")).toHaveText("2. Reject the proposal");
    await expect(guided.locator("ins")).toHaveCount(1);
    await practice.locator("summary").click();
    const plannedCalls = fixture.calls.length;
    await question.fill("Files");
    await question.press("Enter");
    await expect(answer).toContainText(
      "src/assemblies/price-calculator/price-calculator.react.tsx",
    );
    await expect(answer).not.toContainText("price-calculator.css");
    expect(fixture.calls).toHaveLength(plannedCalls);
    await page.screenshot({ path: info.outputPath("authored-tutor-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await practice.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("authored-tutor-narrow.png") });
    await page.setViewportSize({ width: 1280, height: 900 });
    await practice.locator("summary").click();
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(manual);
    expect(writes()).toBe(before);
    await mode.selectOption("approval");
    await guided.getByRole("button", { name: "Reject proposal", exact: true }).click();
    await expect(practice.getByRole("heading")).toHaveText("3. Revise and approve");
    await practice.locator("summary").click();
    const rejectedCalls = fixture.calls.length;
    await question.fill("Files");
    await question.press("Enter");
    await expect(answer).toContainText("No pending proposal");
    await question.fill("Next");
    await question.press("Enter");
    await expect(answer).toContainText('Rename calculator to "Quick estimate"');
    expect(fixture.calls).toHaveLength(rejectedCalls);
    await practice.locator("summary").click();
    await expect(
      practice.getByRole("status", { name: "Practice task", exact: true }),
    ).toContainText('Rename calculator to "Quick estimate"');
    expect(writes()).toBe(before);
    await request.fill('Rename calculator to "Quick estimate"');
    await guided.getByRole("button", { name: "Propose changes", exact: true }).click();
    await expect(guided.getByRole("status")).toHaveText("Plan ready. No files written.");
    await guided.getByRole("button", { name: "Approve changes", exact: true }).click();
    await expect(practice.getByRole("heading")).toHaveText("4. Try Auto");
    await expect(
      practice.getByRole("status", { name: "Practice task", exact: true }),
    ).toContainText("Use presets 1, 3, 6");
    const approved = manual.replaceAll(escaped, '"Quick estimate"');
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(approved);
    await mode.selectOption("auto");
    await guided.getByRole("button", { name: "Use presets 2, 4, 8", exact: true }).click();
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(guided.getByRole("status")).toContainText("already matches");
    await expect(practice.getByRole("heading")).toHaveText("4. Try Auto");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(approved);
    expect(writes()).toBe(before + 1);
    expect(fixture.runtime.builds()).toHaveLength(0);
    await request.fill("Use presets 1, 3, 6");
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(practice.getByRole("heading")).toHaveText("You used all three modes");
    expect(writes()).toBe(before + 2);
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(
      approved.replace("[2,4,8]", "[1, 3, 6]"),
    );
    for (const [file, contents] of Object.entries(kept))
      expect(fixture.calculatorSource(file)).toBe(contents);
    const status = page.getByRole("status", { name: "Workspace status", exact: true });
    await page.getByRole("button", { name: "Check & preview", exact: true }).click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    const preview = page.frameLocator('iframe[title="Application preview"]');
    const calculator = preview.locator('assembly-root[data-name="price-calculator"]');
    await expect(preview.locator("assembly-root")).toHaveCount(13);
    await expect(preview.locator("assembly-root[data-remote]")).toHaveCount(6);
    await expect(preview.locator("assembly-root[data-failed]")).toHaveCount(0);
    await expect(calculator).toHaveAttribute("data-mounted", "");
    await expect(calculator.getByRole("heading", { name: "Quick estimate" })).toBeVisible();
    await expect(calculator.getByRole("button", { name: "4 items", exact: true })).toHaveCount(0);
    const quote = page.waitForResponse(
      (response) => response.url() === `${fixture.runtime.origin}/api/quote`,
    );
    await calculator.getByRole("button", { name: "3 items", exact: true }).click();
    const priced = await quote;
    expect(priced.status()).toBe(200);
    expect(priced.request().postDataJSON().lines[0].quantity).toBe(3);
    await expect(calculator.getByRole("status")).toHaveText(
      `Estimate for 3: $${(((await priced.json()) as { cents: number }).cents / 100).toFixed(2)}`,
    );
    await expect(preview.getByRole("link", { name: "Basket, 0 in it" })).toBeVisible();
    await input.press("Control+Home");
    await input.press("Tab");
    await expect(editor.getByRole("button", { name: "Reload file", exact: true })).toBeFocused();
    await page.locator('iframe[title="Application preview"]').scrollIntoViewIfNeeded();
    await calculator.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath("existing-practice-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const layout = await preview
      .locator("html")
      .evaluate((element) => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    await page.locator('iframe[title="Application preview"]').scrollIntoViewIfNeeded();
    await expect(page.locator('iframe[title="Application preview"]')).toBeInViewport({
      ratio: 0.9,
    });
    await calculator.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("existing-practice-narrow.png") });
    phase = "stop";
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(status).toHaveText("Preview stopped. Your source is kept.");
    expect(fixture.runtime.active()).toEqual([]);
    expect(fixture.runtime.builds()).toHaveLength(4);
    expect(fixture.runtime.builds().every((record: { ok: boolean }) => record.ok)).toBe(true);
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toContain(
      "// Learner note stays.",
    );
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
    expect(failures.length).toBeLessThanOrEqual(1);
    for (const failure of failures) {
      expect(failure.url).toBe(`${fixture.runtime.origin}/api/stock`);
      expect(failure.error).toBe("net::ERR_ABORTED");
      expect(failure.phase).toBe("stop");
    }
  } finally {
    try {
      await writeFile(
        info.outputPath("existing-practice-evidence.json"),
        JSON.stringify(
          {
            errors,
            failures,
            responses,
            calls: fixture.calls,
            builds: fixture.runtime.builds(),
            active: fixture.runtime.active(),
            view: fixture.calculatorSource("price-calculator.react.tsx"),
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
