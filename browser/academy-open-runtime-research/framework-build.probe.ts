// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveOpenRuntime } from "./serve-open-runtime.mjs";

test("the open runtime installs and checks/builds the published framework", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  const asset = process.env["NPM_PROBE_ASSET"];
  if (!asset) throw new Error("real npm delivery asset is required");
  const fixture = await serveOpenRuntime(asset);
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  try {
    await page.goto(fixture.origin);
    await expect(page.locator("#status")).toHaveText(/^(passed|failed)$/, { timeout: 270000 });
    await expect(page.locator("#status")).toHaveText("passed");
    const state = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    const commands = state.records.filter((record: { program?: string }) => record.program);
    expect(commands.map((record: { exit?: number }) => record.exit)).toEqual([
      ...Array(6).fill(0),
      2,
      ...Array(12).fill(0),
      1,
      0,
      0,
    ]);
    const effective = state.records.find(
      (record: { effectivePackages?: unknown }) => record.effectivePackages,
    ).effectivePackages;
    expect(effective["@asmjs/core"].version).toBe("1.0.0-next.2");
    expect(effective["@asmjs/cli"].version).toBe("1.0.0-next.2");
    expect(effective.typescript.version).toBe("6.0.3");
    expect(state.records.at(-1).builtServerBytes).toBeGreaterThan(0);
    expect(
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
    ).toBe(0);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("framework-result.json"),
        (await page
          .locator("#result")
          .textContent({ timeout: 1000 })
          .catch(() => null)) ?? "missing result",
      );
      await writeFile(
        info.outputPath("framework-browser-errors.json"),
        JSON.stringify({ errors, failures }, null, 2),
      );
    } finally {
      await page.close();
      await fixture.close();
    }
  }
});
