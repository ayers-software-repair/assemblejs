// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// B-15 IN A REAL BROWSER, FROM A REAL BUILD. Only a real style engine can say whether a scoped
// selector matches, whether an animation named in one stylesheet runs from another, and whether
// a shadow root keeps a page rule out. The styles example is built by the suite's setup with the
// command line and served by its own dist/server.js.
const example = fileURLToPath(new URL("../examples/styles/", import.meta.url));

let server: ChildProcess | undefined;
let origin = "";

test.beforeAll(async () => {
  const port = String(20000 + Math.floor(Math.random() * 20000));
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
      reject(new Error(`the styles example exited with ${String(code)}`)),
    );
  });
});

test.afterAll(() => {
  server?.kill();
});

test("two assemblies that use the same class name keep their own styles", async ({ page }) => {
  await page.goto(`${origin}/`);
  await expect(page.locator("#notice-title")).toHaveCSS("color", "rgb(200, 0, 0)");
  await expect(page.locator("#badge-title")).toHaveCSS("color", "rgb(0, 0, 200)");
  // `:scope` named the envelope itself.
  await expect(page.locator('assembly-root[data-name="notice"]')).toHaveCSS("display", "block");
});

test("the documented holes still leak, so the documentation cannot go stale", async ({ page }) => {
  await page.goto(`${origin}/`);
  // The badge names an animation only the notice declares, and it runs: @keyframes is global.
  const running = await page
    .locator("#badge-title")
    .evaluate((element) => element.getAnimations().length);
  expect(running).toBe(1);
});

test("an assembly in its own shadow root is isolated both ways, and still hydrates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // A script or stylesheet the content security policy blocked is reported here, not thrown.
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      errors.push(message.text());
    }
  });
  // Every resource the page asked for answered; the browser's own site-icon request aside.
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      errors.push(`${String(response.status())} ${response.url()}`);
    }
  });
  await page.goto(`${origin}/`);
  const panel = page.locator("#panel-title");
  // Server-rendered into a declarative shadow root, its own stylesheet linked inside it.
  await expect(panel).toHaveCSS("color", "rgb(0, 128, 0)");
  expect(
    await page
      .locator('assembly-root[data-name="panel"]')
      .evaluate((element) => element.shadowRoot?.querySelector("link")?.getAttribute("href")),
  ).toMatch(/\/styles\/panel-[0-9a-f]{8}\.shadow\.css$/);
  await expect(page.locator('assembly-root[data-name="panel"]')).toHaveCSS("display", "block");

  // A page-wide rule reaches the light DOM and stops at the shadow boundary.
  await page.evaluate(() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(".title { text-decoration-line: underline; }");
    document.adoptedStyleSheets = [sheet];
  });
  await expect(page.locator("#badge-title")).toHaveCSS("text-decoration-line", "underline");
  await expect(panel).toHaveCSS("text-decoration-line", "none");

  // The React view hydrated inside the shadow root rather than beside it.
  await page.locator("#panel-open").click();
  await expect(page.locator("#panel-open")).toHaveText("Opened 1");
  // Playwright's locators pierce shadow roots, so the light and shadow trees are read directly.
  expect(
    await page.locator('assembly-root[data-name="panel"]').evaluate((element) => ({
      light: element.querySelectorAll("section").length,
      shadow: element.shadowRoot?.querySelectorAll("section").length,
    })),
  ).toEqual({ light: 0, shadow: 1 });
  expect(errors).toEqual([]);
});
