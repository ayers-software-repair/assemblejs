// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { dirname, relative, sep } from "node:path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { serveProbe } from "./serve-probe.mjs";

test("the published framework builds and hydrates every renderer in browser Node", async ({
  page,
}, info) => {
  const apiDirectory = dirname(dirname(fileURLToPath(import.meta.resolve("@webcontainer/api"))));
  const fixture = await serveProbe(apiDirectory);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    expect((await page.request.post(fixture.origin)).status()).toBe(405);
    expect((await page.request.get(`${fixture.origin}/run-probe.js`)).status()).toBe(200);
    const script = fileURLToPath(new URL("./run-probe.js", import.meta.url));
    const outside = relative(apiDirectory + "/dist", script)
      .split(sep)
      .join("%2f");
    expect((await page.request.get(`${fixture.origin}/api/${outside}`)).status()).toBe(404);
    await page.goto(fixture.origin);
    await expect(page.locator("#status")).toHaveText(/^(ready|failed)$/, { timeout: 240000 });
    await expect(page.locator("#status")).toHaveText("ready");
    const result = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    const origins = result.records.find((record: { remoteOrigin?: string }) => record.remoteOrigin);
    expect(new URL(origins.remoteOrigin).origin).not.toBe(new URL(origins.pageOrigin).origin);
    const preview = page.frameLocator("#preview");
    for (const renderer of ["preact", "react", "vue", "svelte", "solid", "lit"]) {
      const assembly = preview.locator(`assembly-root[data-name="${renderer}-probe"]`);
      await expect(assembly).toContainText(`${renderer}-probe`);
      await expect(assembly).toHaveAttribute("data-mounted", "");
    }
    for (const renderer of ["ejs", "handlebars", "markdown", "nunjucks", "pug"]) {
      await expect(preview.locator(`assembly-root[data-name="${renderer}-probe"]`)).toContainText(
        `${renderer}-probe`,
      );
    }
    const remote = preview.locator('assembly-root[data-name="remote-probe"]');
    await expect(remote).toContainText("remote-probe");
    await expect(remote).toHaveAttribute("data-remote", origins.remoteOrigin);
    await expect(remote).toHaveAttribute("data-mounted", "");
    expect(errors).toEqual([]);
    await page.getByRole("button", { name: "Stop runtime", exact: true }).click();
    await expect(page.locator("#status")).toHaveText("stopped");
    const stopped = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    expect(
      stopped.records.find((record: { stoppedServerExits?: number[] }) => record.stoppedServerExits)
        .stoppedServerExits,
    ).toHaveLength(2);
  } finally {
    try {
      if (!page.isClosed()) {
        try {
          const evidence = info.outputPath("final-state.json");
          await writeFile(
            evidence,
            (await page
              .locator("#result")
              .textContent({ timeout: 1000 })
              .catch(() => null)) ?? "missing result",
          );
          await info.attach("final-state.json", {
            path: evidence,
            contentType: "application/json",
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await fixture.close();
    }
  }
});
