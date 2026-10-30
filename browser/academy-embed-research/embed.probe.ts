// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveEmbed } from "./serve-embed.mjs";

test("the public editor SDK runs real framework checks and source edits without login", async ({
  page,
}, info) => {
  const fixture = await serveEmbed();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    expect((await page.request.post(fixture.origin)).status()).toBe(405);
    expect((await page.request.get(fixture.origin + "/package.json")).status()).toBe(404);
    await page.goto(fixture.origin);
    await expect(page.locator("#status")).toHaveText(/^(ready|failed)$/, { timeout: 300000 });
    await expect(page.locator("#status")).toHaveText("ready");
    await expect(page.getByRole("button", { name: "Change assembly", exact: true })).toBeEnabled({
      timeout: 30000,
    });
    const state = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    expect(state.records.some((record: { exit?: number }) => record.exit === 1)).toBe(true);
    expect(state.records.filter((record: { timedOut?: boolean }) => record.timedOut)).toEqual([]);
    const origin = new URL(state.previewUrl).origin;
    await expect
      .poll(() => page.frames().some((frame) => frame.url().startsWith(origin)), { timeout: 30000 })
      .toBe(true);
    const preview = page.frames().find((frame) => frame.url().startsWith(origin));
    if (!preview) throw new Error("SDK preview frame missing");
    const assembly = preview.locator('assembly-root[data-name="react-probe"]');
    await expect(assembly).toContainText("react-probe");
    await expect(assembly).toHaveAttribute("data-mounted", "");
    await page.getByRole("button", { name: "Change assembly", exact: true }).click();
    await expect(assembly).toContainText("Edited SDK assembly", { timeout: 30000 });
    await expect(assembly).toHaveAttribute("data-mounted", "");
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Stop project", exact: true }).click();
    await expect(page.locator("#status")).toHaveText("stopped", { timeout: 30000 });
    const stopped = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    const exit = stopped.records.find(
      (record: { program?: string }) => record.program === "dev server",
    ).exit;
    expect(
      exit.signal === "SIGTERM" || (exit.signal === null && [0, 143].includes(exit.code)),
    ).toBe(true);
  } finally {
    try {
      const evidence = info.outputPath("final-state.json");
      await writeFile(
        evidence,
        (await page
          .locator("#result")
          .textContent({ timeout: 1000 })
          .catch(() => null)) ?? "missing result",
      );
      await info.attach("final-state.json", { path: evidence, contentType: "application/json" });
      await page
        .screenshot({ path: info.outputPath("editor-sdk.png"), fullPage: true })
        .catch(() => undefined);
    } finally {
      await page.close();
      await fixture.close();
    }
  }
});
