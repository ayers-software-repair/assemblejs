// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { freePort, saidBy } from "./child-server.js";

// The Shadow DOM opt-in for every framework, in a real browser from a real build: each assembly
// is server-rendered into its own declarative shadow root with its stylesheet linked there, and
// its framework hydrates that root without dropping the link, replacing the server's markup or
// reporting a mismatch.
const example = fileURLToPath(new URL("../examples/shadow/", import.meta.url));
const FRAMEWORKS = ["react", "preact", "svelte", "vue", "solid", "lit"] as const;

// Holds the page's one script until released, so a test can capture what the server sent before
// anything hydrates it, and later tell an adopted element from a replacement.
const holdScript = async (page: Page): Promise<() => void> => {
  let release = (): void => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/_assemblejs\/assets\/client-[^/]+\.js$/, async (route) => {
    await held;
    await route.continue();
  });
  return release;
};

let server: ChildProcess | undefined;
let origin = "";

test.beforeAll(async () => {
  const port = await freePort();
  server = spawn(process.execPath, ["dist/server.js"], {
    cwd: example,
    env: { ...process.env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  origin = await new Promise<string>((resolve, reject) => {
    server?.stdout?.on("data", (chunk: Buffer) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found?.[1] !== undefined) resolve(found[1]);
    });
    server?.on("exit", (code) =>
      reject(new Error(`the example exited with ${String(code)}${saidBy(server)}`)),
    );
  });
});

test.afterAll(() => {
  server?.kill();
});

for (const framework of FRAMEWORKS) {
  test(`a ${framework} assembly in its own shadow root keeps its stylesheet and its markup`, async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      const text = message.text();
      if (text.startsWith("Failed to load resource")) return;
      if (message.type() === "error" || message.type() === "warning") problems.push(text);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
        problems.push(`${String(response.status())} ${response.url()}`);
      }
    });
    const release = await holdScript(page);
    await page.goto(`${origin}/`, { waitUntil: "commit" });
    const host = page.locator(`assembly-root[data-name="${framework}-box"]`);
    const bump = page.locator(`#${framework}-bump`);
    // Styled and captured from the server's markup, before the script that hydrates it runs.
    await expect(bump).toHaveCSS("color", "rgb(0, 128, 0)");
    await bump.evaluate((element) => ((window as unknown as { kept: Element }).kept = element));
    release();
    // Every island's own module fetched, after which each mounts at once.
    await page.waitForLoadState("networkidle");
    await bump.click();
    await expect(bump).toHaveText(`${framework} 1`);
    expect(
      await host.evaluate((element) => ({
        kept:
          (window as unknown as { kept: Element }).kept ===
          element.shadowRoot?.querySelector(".bump"),
        links: element.shadowRoot?.querySelectorAll('link[rel="stylesheet"]').length,
        buttons: element.shadowRoot?.querySelectorAll("button").length,
      })),
    ).toEqual({ kept: true, links: 1, buttons: 1 });
    await expect(bump).toHaveCSS("color", "rgb(0, 128, 0)");
    expect(problems).toEqual([]);
  });
}

test("a deferred assembly in its own shadow root is filled into that root, styled and hydrated", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (text.startsWith("Failed to load resource")) return;
    if (message.type() === "error" || message.type() === "warning") problems.push(text);
  });
  // Every file the page and its fills asked for answered; the site icon is the browser's own ask.
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      problems.push(`${String(response.status())} ${response.url()}`);
    }
  });
  await page.goto(`${origin}/later`);
  await expect(page.locator("assembly-root[data-defer]")).toHaveCount(0);
  for (const framework of ["react", "svelte"]) {
    const host = page.locator(`assembly-root[data-name="${framework}-box"]`);
    const bump = page.locator(`#${framework}-bump`);
    await expect(bump).toHaveCSS("color", "rgb(0, 128, 0)");
    await bump.click();
    await expect(bump).toHaveText(`${framework} 1`);
    expect(
      await host.evaluate((element) => ({
        inShadow: element.shadowRoot?.querySelector(".bump") !== null,
        links: element.shadowRoot?.querySelectorAll('link[rel="stylesheet"]').length,
      })),
    ).toEqual({ inShadow: true, links: 1 });
  }
  expect(problems).toEqual([]);
});
