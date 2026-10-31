// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveModes } from "./serve-modes.mjs";

test("workspace refuses observed outside edits before building, then recovers on current source", async ({
  page,
}, info) => {
  test.setTimeout(150000);
  const fixture = await serveModes("workspace");
  const errors: string[] = [];
  const responses: number[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) responses.push(response.status());
  });
  try {
    await page.goto(`${fixture.origin}/?workspace`);
    const build = page.getByRole("button", { name: "Check & preview", exact: true });
    const status = page.getByRole("status", { name: "Workspace status", exact: true });
    const diagnostics = page.locator(".academy-application-preview details pre");
    let changed = false;
    await page.route("**/call-tool", async (route) => {
      if (!changed && route.request().postDataJSON().name === "check") {
        const reply = await route.fetch();
        fixture.outside("source-guard", "<p>Outside edit is kept.</p>");
        changed = true;
        await route.fulfill({ response: reply });
      } else await route.continue();
    });
    await build.click();
    await expect(status).toContainText("Preview could not start");
    await expect(diagnostics).toContainText("Project source changed");
    expect(changed).toBe(true);
    expect(fixture.runtime.builds()).toEqual([]);
    await expect(page.locator("iframe")).toHaveCount(0);
    expect(fixture.source("source-guard")).toBe("<p>Outside edit is kept.</p>");
    await page.getByText("Build diagnostics", { exact: true }).click();
    await page.screenshot({
      path: info.outputPath("workspace-source-change-refused.png"),
      fullPage: true,
    });
    await page.unroute("**/call-tool");
    await build.click();
    await expect(status).toContainText("Build completed", { timeout: 60000 });
    const preview = page.frameLocator('iframe[title="Application preview"]');
    await expect(preview.locator("assembly-root")).toHaveCount(12);
    await expect(preview.locator("assembly-root[data-failed]")).toHaveCount(0);
    const current = await fetch(`${fixture.origin}/call-tool`, {
      method: "POST",
      headers: { Origin: fixture.origin, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "read_source_version", arguments: {} }),
    });
    expect(current.status).toBe(200);
    const answer = JSON.parse((await current.json()).content[0].text) as {
      ok: boolean;
      result: { version: string };
      problems: unknown[];
    };
    expect(answer.ok).toBe(true);
    expect(answer.problems).toEqual([]);
    expect(answer.result.version).toMatch(/^[a-f0-9]{12}$/);
    expect(JSON.parse((await diagnostics.textContent()) ?? "{}").version).toBe(
      answer.result.version,
    );
    expect(fixture.runtime.builds()).toHaveLength(4);
    expect(fixture.runtime.builds().every((record: { ok: boolean }) => record.ok)).toBe(true);
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(status).toHaveText("Preview stopped. Your source is kept.");
    expect(fixture.runtime.active()).toEqual([]);
    expect(fixture.source("source-guard")).toBe("<p>Outside edit is kept.</p>");
    expect(errors).toEqual([]);
    expect(responses).toEqual([]);
  } finally {
    try {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    } finally {
      await writeFile(
        info.outputPath("workspace-source-version.json"),
        JSON.stringify(
          {
            errors,
            responses,
            calls: fixture.calls,
            builds: fixture.runtime.builds(),
            active: fixture.runtime.active(),
          },
          null,
          2,
        ),
      );
      expect(fixture.runtime.active()).toEqual([]);
    }
  }
});
