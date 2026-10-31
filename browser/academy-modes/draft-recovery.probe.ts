// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("a real reload recovers unsaved source and preserves a conflicting writer's file", async ({
  page,
}, info) => {
  const fixture = await serveModes();
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failures.push(request.url()));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  try {
    const original = fixture.source("hello");
    await page.goto(`${fixture.origin}/?editor`);
    const panel = page.getByRole("region", { name: "Project code", exact: true });
    const tree = panel.getByRole("navigation", { name: "Project files" });
    const source = panel.getByRole("textbox", { name: "Source code", exact: true });
    const recovery = panel.getByRole("region", { name: "Draft recovery", exact: true });
    await tree.getByRole("button").click();
    await expect(source).toHaveValue(original);
    const draft = "<p>Unsaved learner introduction 茶</p>\n";
    await source.fill(draft);
    await expect(recovery).toContainText("Draft kept for reload in this tab");
    expect(fixture.source("hello")).toBe(original);
    await page.reload();
    await tree.getByRole("button").click();
    await expect(source).toHaveValue(draft);
    await expect(recovery).toContainText("Recovered unsaved draft");
    expect(fixture.source("hello")).toBe(original);
    expect(
      fixture.calls.filter((call: { name: string }) => call.name === "apply_source_changes"),
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath("draft-recovered-desktop.png"), fullPage: true });
    await panel.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("Saved");
    expect(fixture.source("hello")).toBe(draft);
    const conflicting = "<p>My second unsaved draft</p>\n";
    await source.fill(conflicting);
    const outside = "<p>Outside agent edit stays</p>\n";
    fixture.outside("hello", outside);
    await page.reload();
    await tree.getByRole("button").click();
    await expect(source).toHaveValue(outside);
    const recovered = recovery.getByRole("textbox", { name: "Recovered draft", exact: true });
    await expect(recovered).toHaveValue(conflicting);
    await expect(recovered).toHaveAttribute("readonly", "");
    await expect(recovery).toContainText("The recovered draft was not restored");
    expect(fixture.source("hello")).toBe(outside);
    await expect(panel.getByRole("button", { name: "Save file", exact: true })).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await recovered.focus();
    await recovered.press("Control+A");
    expect(
      await recovered.evaluate((input: HTMLTextAreaElement) => [
        input.selectionStart,
        input.selectionEnd,
      ]),
    ).toEqual([0, conflicting.length]);
    await recovered.press("Tab");
    const discard = recovery.getByRole("button", { name: "Discard recovered draft", exact: true });
    await expect(discard).toBeFocused();
    await page.screenshot({ path: info.outputPath("draft-conflict-narrow.png"), fullPage: true });
    const merged = outside + conflicting;
    await source.fill(merged);
    await expect(recovered).toHaveValue(conflicting);
    expect(fixture.source("hello")).toBe(outside);
    await discard.click();
    await expect(recovered).toBeHidden();
    await panel.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("Saved");
    expect(fixture.source("hello")).toBe(merged);
    expect(
      fixture.calls.filter((call: { name: string }) => call.name === "apply_source_changes"),
    ).toEqual([
      {
        name: "apply_source_changes",
        arguments: {
          changes: [{ path: "src/assemblies/hello/hello.html", before: original, after: draft }],
        },
      },
      {
        name: "apply_source_changes",
        arguments: {
          changes: [{ path: "src/assemblies/hello/hello.html", before: outside, after: merged }],
        },
      },
    ]);
    await page.reload();
    await tree.getByRole("button").click();
    await expect(source).toHaveValue(merged);
    await expect(panel.getByRole("button", { name: "Save file", exact: true })).toBeDisabled();
    await expect(recovery).toBeHidden();
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("draft-recovery-evidence.json"),
        JSON.stringify(
          { errors, failures, calls: fixture.calls, source: fixture.source("hello") },
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
  }
});

for (const failure of ["denied", "quota"] as const) {
  test(`actual ${failure} storage reports failure while explicit guarded Save still works`, async ({
    page,
  }, info) => {
    const fixture = await serveModes();
    const errors: string[] = [];
    const failures: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => failures.push(request.url()));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push(message.text());
    });
    try {
      await page.addInitScript((failure) => {
        if (failure === "denied")
          Object.defineProperty(window, "sessionStorage", {
            get() {
              throw new DOMException("Storage denied for proof", "SecurityError");
            },
          });
        else
          Object.defineProperty(Storage.prototype, "setItem", {
            value() {
              throw new DOMException("Quota exhausted for proof", "QuotaExceededError");
            },
          });
      }, failure);
      const original = fixture.source("hello");
      await page.goto(`${fixture.origin}/?editor`);
      const panel = page.getByRole("region", { name: "Project code", exact: true });
      await panel.getByRole("navigation", { name: "Project files" }).getByRole("button").click();
      const source = panel.getByRole("textbox", { name: "Source code", exact: true });
      const draft = `<p>Explicit Save despite ${failure} draft storage</p>\n`;
      await source.fill(draft);
      const recovery = panel.getByRole("region", { name: "Draft recovery", exact: true });
      await expect(recovery).toContainText(
        failure === "denied" ? "SecurityError" : "QuotaExceededError",
      );
      expect(fixture.source("hello")).toBe(original);
      await page.screenshot({
        path: info.outputPath(`draft-storage-${failure}.png`),
        fullPage: true,
      });
      await panel.getByRole("button", { name: "Save file", exact: true }).click();
      await expect(panel.getByRole("status")).toContainText("Saved");
      if (failure === "quota") await expect(recovery).toBeHidden();
      else await expect(recovery).not.toContainText("only in memory");
      expect(fixture.source("hello")).toBe(draft);
      await page.screenshot({
        path: info.outputPath(`draft-storage-${failure}-saved.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
      expect(failures).toEqual([]);
    } finally {
      try {
        await writeFile(
          info.outputPath(`draft-storage-${failure}.json`),
          JSON.stringify({ errors, failures, calls: fixture.calls }, null, 2),
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
}
