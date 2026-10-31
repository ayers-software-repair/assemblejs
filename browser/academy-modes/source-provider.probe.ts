// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("editor saves through real MCP and keeps drafts when another writer changed the file", async ({
  page,
}, info) => {
  const fixture = await serveModes();
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
    const original = fixture.source("hello");
    expect(original).toBeTruthy();
    await page.goto(`${fixture.origin}/?editor`);
    const panel = page.getByRole("region", { name: "Project code" });
    await panel.getByRole("navigation", { name: "Project files" }).getByRole("button").click();
    const source = panel.getByRole("textbox", { name: "Source code" });
    await expect(source).toHaveValue(original);
    expect(fixture.calls.map((call: { name: string }) => call.name)).toEqual(["read_source"]);
    const saved = "<section><p>Manual calculator note 茶</p></section>\n";
    await source.fill(saved);
    expect(fixture.source("hello")).toBe(original);
    await panel.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("Run checks to update the preview");
    expect(fixture.source("hello")).toBe(saved);
    await page.screenshot({ path: info.outputPath("source-provider-desktop.png"), fullPage: true });
    const draft = "<p>Unsaved learner draft</p>\n";
    await source.fill(draft);
    const outside = "<p>Agent change survives</p>\n";
    fixture.outside("hello", outside);
    await panel.getByRole("button", { name: "Save file", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("source changed since review");
    await expect(source).toHaveValue(draft);
    expect(fixture.source("hello")).toBe(outside);
    await expect(panel.getByRole("button", { name: "Save file", exact: true })).toBeEnabled();
    expect(fixture.calls).toEqual([
      { name: "read_source", arguments: { path: "src/assemblies/hello/hello.html" } },
      {
        name: "apply_source_changes",
        arguments: {
          changes: [{ path: "src/assemblies/hello/hello.html", before: original, after: saved }],
        },
      },
      {
        name: "apply_source_changes",
        arguments: {
          changes: [{ path: "src/assemblies/hello/hello.html", before: saved, after: draft }],
        },
      },
    ]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath("source-provider-narrow.png"), fullPage: true });
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("source-provider-calls.json"),
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
