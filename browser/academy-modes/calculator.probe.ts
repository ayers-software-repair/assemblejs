// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("authored calculator plans, revised approval, Auto and manual edits share actual Market source", async ({
  page,
}, info) => {
  const fixture = await serveModes(true);
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  const files = [
    "price-calculator.react.tsx",
    "price-calculator.css",
    "price-calculator.service.ts",
    "request-estimate.ts",
    "product.html",
  ];
  try {
    const beforePage = fixture.calculatorSource("product.html");
    expect(beforePage).toBeTruthy();
    await page.goto(`${fixture.origin}/?calculator`);
    const guided = page.getByRole("region", { name: "Guided calculator", exact: true });
    const mode = guided.getByRole("combobox", { name: "Agent mode" });
    const status = guided.getByRole("status");
    await guided.getByRole("button", { name: "Plan changes", exact: true }).click();
    await expect(status).toHaveText("Plan ready. No files written.");
    await expect(guided.locator("ins")).toHaveCount(5);
    await expect(guided.locator("del")).toHaveCount(1);
    for (const file of files.slice(0, 4)) expect(fixture.calculatorSource(file)).toBeNull();
    expect(fixture.calculatorSource("product.html")).toBe(beforePage);
    expect(fixture.calls.every((call: { name: string }) => call.name === "read_source")).toBe(true);
    await mode.selectOption("auto");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBeNull();
    await mode.selectOption("approval");
    await guided.getByRole("button", { name: "Reject proposal", exact: true }).click();
    await expect(status).toHaveText("Proposal rejected. No files were written.");
    expect(fixture.calls.every((call: { name: string }) => call.name === "read_source")).toBe(true);
    await guided
      .getByRole("button", { name: 'Add a calculator called "Coffee total"', exact: true })
      .click();
    await guided.getByRole("button", { name: "Propose changes", exact: true }).click();
    await expect(status).toHaveText("Plan ready. No files written.");
    const reviewed = await guided.locator("ins").allTextContents();
    await page.screenshot({
      path: info.outputPath("calculator-review-desktop.png"),
      fullPage: true,
    });
    await guided.getByRole("button", { name: "Approve changes", exact: true }).click();
    await expect(
      guided.getByRole("button", { name: "Propose changes", exact: true }),
    ).toBeEnabled();
    await writeFile(
      info.outputPath("calculator-first-result.json"),
      (await guided.locator("details pre").textContent()) ?? "",
    );
    await expect(status).toContainText("project check passed");
    for (let index = 0; index < files.length; index++)
      expect(fixture.calculatorSource(files[index])).toBe(reviewed[index]);
    await mode.selectOption("auto");
    await guided.getByRole("button", { name: "Use presets 2, 4, 8", exact: true }).click();
    await guided.getByRole("button", { name: "Apply request and check", exact: true }).click();
    await expect(status).toContainText("project check passed");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toContain("[2, 4, 8].map");
    await mode.selectOption("approval");
    await guided
      .getByRole("button", { name: 'Rename calculator to "Order total"', exact: true })
      .click();
    await guided.getByRole("button", { name: "Propose changes", exact: true }).click();
    await expect(status).toHaveText("Plan ready. No files written.");
    const editor = page.getByRole("region", { name: "Project code", exact: true });
    await editor
      .getByRole("navigation", { name: "Project files" })
      .getByRole("button", {
        name: "src/assemblies/price-calculator/price-calculator.react.tsx",
        exact: true,
      })
      .click();
    const input = editor.getByRole("textbox", { name: "Source code" });
    await expect(input).toHaveValue(fixture.calculatorSource("price-calculator.react.tsx"));
    const manual =
      fixture.calculatorSource("price-calculator.react.tsx") + "\n// Manual note stays.\n";
    await input.fill(manual);
    await expect(editor.getByRole("button", { name: "Reload file", exact: true })).toBeDisabled();
    await editor.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(editor.getByRole("status")).toContainText("Saved");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(manual);
    const checksBefore = fixture.calls.filter(
      (call: { name: string }) => call.name === "check",
    ).length;
    await guided.getByRole("button", { name: "Approve changes", exact: true }).click();
    await expect(status).toContainText("Apply refused or incomplete");
    expect(fixture.calculatorSource("price-calculator.react.tsx")).toBe(manual);
    expect(fixture.calls.filter((call: { name: string }) => call.name === "check").length).toBe(
      checksBefore,
    );
    await expect(
      guided.getByRole("button", { name: "Approve changes", exact: true }),
    ).toBeDisabled();
    await guided.getByRole("button", { name: "Propose changes", exact: true }).click();
    await expect(status).toHaveText("Plan ready. No files written.");
    await guided.getByRole("button", { name: "Approve changes", exact: true }).click();
    await expect(status).toContainText("project check passed");
    const final = fixture.calculatorSource("price-calculator.react.tsx");
    expect(final).toContain('<h2>{"Order total"}</h2>');
    expect(final).toContain("[2, 4, 8].map");
    expect(final).toContain("// Manual note stays.");
    await editor.getByRole("button", { name: "Reload file", exact: true }).click();
    await expect(input).toHaveValue(final);
    await expect(editor.getByRole("status")).toContainText("Reloaded");
    expect(
      fixture.calls.filter((call: { name: string }) => call.name === "apply_source_changes"),
    ).toHaveLength(5);
    expect(fixture.calls.filter((call: { name: string }) => call.name === "check")).toHaveLength(3);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("calculator-final-narrow.png"), fullPage: true });
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("calculator-tool-calls.json"),
        JSON.stringify(fixture.calls, null, 2),
      );
    } finally {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    }
  }
});
