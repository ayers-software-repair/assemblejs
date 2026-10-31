// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveEditor } from "./serve-editor.mjs";

test("actual source saves, unsaved tabs, stale refusal and keyboard editing", async ({
  page,
}, info) => {
  const fixture = await serveEditor();
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  try {
    await page.goto(fixture.origin);
    const tree = page.getByRole("navigation", { name: "Project files" });
    await tree.getByRole("button", { name: "price-calculator.react.tsx", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Source code" });
    const original = fixture.readFile("price-calculator.react.tsx");
    await expect(input).toHaveValue(original);
    const edited = original.replaceAll("Order estimate", "My estimate");
    await input.fill(edited);
    await tree.getByRole("button", { name: "request-estimate.ts", exact: true }).click();
    await expect(input).toHaveValue(fixture.readFile("request-estimate.ts"));
    await page
      .getByRole("navigation", { name: "Open files" })
      .getByRole("button", { name: "price-calculator.react.tsx *", exact: true })
      .click();
    await expect(input).toHaveValue(edited);
    expect(fixture.readFile("price-calculator.react.tsx")).toBe(original);
    await input.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Save file", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText(
      "Saved price-calculator.react.tsx. Run checks to update the preview.",
    );
    expect(fixture.readFile("price-calculator.react.tsx")).toBe(edited);
    await page.screenshot({ path: info.outputPath("editor-desktop.png"), fullPage: true });
    await input.press("Control+End");
    await expect
      .poll(async () =>
        input.evaluate((node) => {
          const textarea = node as HTMLTextAreaElement;
          const painted = textarea.previousElementSibling as HTMLElement;
          return Math.abs(textarea.scrollTop - painted.scrollTop);
        }),
      )
      .toBeLessThanOrEqual(1);
    const metrics = await input.evaluate((node) => {
      const textarea = node as HTMLTextAreaElement;
      const painted = textarea.previousElementSibling as HTMLElement;
      return {
        sourceEndsWithNewline: textarea.value.endsWith("\n"),
        caret: textarea.selectionEnd,
        sourceLength: textarea.value.length,
        textareaTop: textarea.scrollTop,
        paintedTop: painted.scrollTop,
        textareaHeight: textarea.scrollHeight,
        paintedHeight: painted.scrollHeight,
      };
    });
    expect(metrics.sourceEndsWithNewline).toBe(true);
    expect(metrics.caret).toBe(metrics.sourceLength);
    expect(metrics.textareaTop).toBeGreaterThan(0);
    expect(Math.abs(metrics.textareaHeight - metrics.paintedHeight)).toBeLessThanOrEqual(1);
    await writeFile(info.outputPath("editor-metrics.json"), JSON.stringify(metrics, null, 2));
    await page.screenshot({ path: info.outputPath("editor-bottom.png"), fullPage: true });
    await input.evaluate((node) => {
      const textarea = node as HTMLTextAreaElement;
      textarea.setSelectionRange(textarea.value.length - 160, textarea.value.length);
    });
    await page.screenshot({ path: info.outputPath("editor-selection.png"), fullPage: true });
    await input.press("Control+Home");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(input).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("editor-narrow.png"), fullPage: true });
    await input.fill(edited + "\n// unsaved draft\n");
    fixture.editFile("price-calculator.react.tsx", "outside edit\n");
    const refusal = page.waitForResponse((response) => response.request().method() === "PUT");
    await page.getByRole("button", { name: "Save file", exact: true }).click();
    expect((await refusal).status()).toBe(409);
    await expect(page.getByRole("status")).toContainText("outside edit kept");
    await expect(input).toHaveValue(edited + "\n// unsaved draft\n");
    expect(fixture.readFile("price-calculator.react.tsx")).toBe("outside edit\n");
    expect(failures).toEqual([]);
    // Chromium reports the intentionally refused HTTP response to its console.
    expect(errors).toEqual([
      "Failed to load resource: the server responded with a status of 409 (Conflict)",
    ]);
  } finally {
    try {
      await page.close();
    } finally {
      await fixture.close();
    }
  }
});
