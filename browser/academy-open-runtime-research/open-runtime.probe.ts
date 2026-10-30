// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { serveOpenRuntime } from "./serve-open-runtime.mjs";

test("published MIT runtime boots and preserves finite process/file results", async ({
  page,
}, info) => {
  const fixture = await serveOpenRuntime();
  const errors: string[] = [];
  const missing: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) missing.push(response.url());
  });
  try {
    expect((await page.request.post(fixture.origin)).status()).toBe(405);
    const root = dirname(fileURLToPath(import.meta.resolve("@vivari/core")));
    const script = fileURLToPath(new URL("./run-open-runtime.js", import.meta.url));
    const outside = relative(root, script).split(sep).join("%2f");
    expect((await page.request.get(`${fixture.origin}/${outside}`)).status()).toBe(404);
    expect((await page.request.get(fixture.origin + "/vivari-license.txt")).status()).toBe(200);
    await page.goto(fixture.origin);
    await expect(page.locator("#status")).toHaveText(/^(passed|failed)$/, { timeout: 70000 });
    await expect(page.locator("#status")).toHaveText("passed");
    const state = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    const commands = state.records.filter(
      (record: { program?: string }) => record.program === "node",
    );
    expect(commands.map((record: { exit?: number }) => record.exit)).toEqual([0, 7]);
    expect(commands[0].output).toContain("finite proof");
    expect(commands[1].output).toContain("deliberate nonzero exit");
    expect(state.records.at(-1).fileRoundTrip).toBe("assembly proof");
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
    expect(
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length),
    ).toBe(0);
  } finally {
    try {
      await writeFile(
        info.outputPath("final-state.json"),
        (await page
          .locator("#result")
          .textContent({ timeout: 1000 })
          .catch(() => null)) ?? "missing result",
      );
      await writeFile(
        info.outputPath("browser-errors.json"),
        JSON.stringify({ errors, missing }, null, 2),
      );
    } finally {
      await page.close();
      await fixture.close();
    }
  }
});
