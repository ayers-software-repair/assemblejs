// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { Response } from "@playwright/test";
import { boundedOperation } from "../academy-open-runtime-research/bounded-operation.js";
import { serveOpenRuntime } from "../academy-open-runtime-research/serve-open-runtime.mjs";

test("the built application mounts frameworks, handles input and stops", async ({ page }, info) => {
  const asset = process.env["NPM_PROBE_ASSET"];
  if (!asset) throw new Error("actual npm delivery required");
  const fixture = await serveOpenRuntime(asset, true);
  const errors: string[] = [];
  const failures: string[] = [];
  let previewPolicy = "";
  let cleanupWorkers: { before: number; after: number } | null = null;
  let cleanupFailure: string | undefined;
  let screenshotFailure: string | undefined;
  let resolveDocument: (value: Response) => void = () => {};
  const document = new Promise<Response>((resolve) => {
    resolveDocument = resolve;
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    if (
      new URL(response.url()).pathname === "/preview/3210/" &&
      response.request().resourceType() === "document"
    )
      resolveDocument(response);
  });
  try {
    expect((await page.request.post(fixture.origin)).status()).toBe(405);
    await page.goto(fixture.origin);
    await expect(page.locator("#status")).toHaveText(/^(server ready|failed)$/, {
      timeout: 270000,
    });
    await expect(page.locator("#status")).toHaveText("server ready");
    const response = await boundedOperation(document, "preview document");
    expect(response.status()).toBe(200);
    const headers = await boundedOperation(response.allHeaders(), "preview headers");
    const policy = headers["content-security-policy"] ?? "";
    previewPolicy = policy;
    expect(policy).toContain("frame-ancestors 'self'");
    const before = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    const hashes = before.records.find(
      (record: { previewShimHashes?: string[] }) => record.previewShimHashes,
    ).previewShimHashes;
    for (const hash of hashes) expect(policy).toContain(hash);
    expect(policy.match(/script-src[^;]*/)?.[0]).not.toContain("unsafe-inline");
    const preview = page.frameLocator("#preview");
    for (const renderer of ["preact", "react", "vue", "svelte", "solid", "lit"]) {
      const assembly = preview.locator(`assembly-root[data-name="${renderer}-probe"]`);
      await expect(assembly).toContainText(`${renderer}-probe`);
      await expect(assembly).toHaveAttribute("data-mounted", "");
    }
    for (const renderer of ["ejs", "handlebars", "markdown", "nunjucks", "pug"])
      await expect(preview.locator(`assembly-root[data-name="${renderer}-probe"]`)).toContainText(
        `${renderer}-probe`,
      );
    await preview.getByRole("button", { name: "Preview count 0", exact: true }).click();
    await expect(
      preview.getByRole("button", { name: "Preview count 1", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Stop preview", exact: true }).click();
    await expect(page.locator("#status")).toHaveText("passed");
    const state = JSON.parse((await page.locator("#result").textContent()) ?? "{}");
    expect(
      state.records.find((record: { stoppedServerExit?: number }) => record.stoppedServerExit)
        .stoppedServerExit,
    ).toBe(143);
    expect(errors).toEqual([]);
    expect(failures).toEqual([]);
  } finally {
    try {
      try {
        await page.screenshot({ path: info.outputPath("built-preview.png"), timeout: 5000 });
      } catch (error) {
        screenshotFailure = String(error);
      }
      try {
        cleanupWorkers = await boundedOperation(
          page.evaluate(async () => {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
            return {
              before: registrations.length,
              after: (await navigator.serviceWorker.getRegistrations()).length,
            };
          }),
          "preview SW cleanup",
        );
      } catch (error) {
        cleanupFailure = String(error);
      } finally {
        await writeFile(
          info.outputPath("preview-state.json"),
          (await page
            .locator("#result")
            .textContent({ timeout: 1000 })
            .catch(() => null)) ?? "missing result",
        );
        await writeFile(
          info.outputPath("preview-browser-errors.json"),
          JSON.stringify(
            { errors, failures, previewPolicy, cleanupWorkers, cleanupFailure, screenshotFailure },
            null,
            2,
          ),
        );
      }
    } finally {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    }
  }
  expect(cleanupFailure).toBeUndefined();
  expect(screenshotFailure).toBeUndefined();
  expect(cleanupWorkers).toEqual({ before: 1, after: 0 });
});
