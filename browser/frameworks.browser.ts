// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { freePort, saidBy } from "./child-server.js";

// B-16 IN A REAL BROWSER, FROM A REAL BUILD: one assembly per framework on one page. Each is
// server-rendered, hydrated by its own renderer, and talks to the others over the page's bus,
// so every framework proves both halves of its renderer and the events binding at once.
const example = fileURLToPath(new URL("../examples/frameworks/", import.meta.url));
const FRAMEWORKS = ["react", "svelte", "preact", "vue", "solid", "lit"] as const;
// The nested page: one plain html assembly places a shell per framework, and each shell places a
// counter written in another. Each pair is the shell's framework, then its counter's.
const NESTED = [
  ["react", "svelte"],
  ["svelte", "preact"],
  ["preact", "vue"],
  ["vue", "solid"],
  ["solid", "lit"],
  ["lit", "react"],
] as const;

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

// What a page reports when something on it went wrong: an uncaught error, a console error or
// warning (a hydration mismatch is reported, not thrown), or a response that failed.
const problemsOn = (page: Page): string[] => {
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
  return problems;
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
  test(`a ${framework} assembly hydrates the markup the server sent, and is heard by every other`, async ({
    page,
  }) => {
    const errors = problemsOn(page);
    const release = await holdScript(page);
    await page.goto(`${origin}/`, { waitUntil: "commit" });
    const bump = page.locator(`#${framework}-bump`);
    // Server-rendered: the markup is there, and captured, before the script that hydrates it runs.
    await expect(bump).toHaveText(`${framework} 0`);
    await bump.evaluate((element) => ((window as unknown as { kept: Element }).kept = element));
    release();
    // Every island's own module fetched, after which each mounts at once.
    await page.waitForLoadState("networkidle");
    await expect(page.locator("script[data-assembly]")).toHaveCount(0);
    await bump.click();
    await expect(bump).toHaveText(`${framework} 1`);
    // The same element the server sent, adopted rather than replaced.
    expect(
      await bump.evaluate((element) => (window as unknown as { kept: Element }).kept === element),
    ).toBe(true);
    for (const other of FRAMEWORKS.filter((name) => name !== framework)) {
      await expect(page.locator(`#${other}-heard`)).toHaveText(`${framework}-counter`);
    }
    expect(errors).toEqual([]);
  });
}

test("a Vue component's scoped style applies to the markup it hydrated", async ({ page }) => {
  await page.goto(`${origin}/`);
  // Scoped under one id in both bundles, built apart, or the server's markup would not match it.
  await expect(page.locator("#vue-bump")).toHaveCSS("color", "rgb(0, 120, 60)");
  await page.locator("#vue-bump").click();
  await expect(page.locator("#vue-bump")).toHaveCSS("color", "rgb(0, 120, 60)");
});

test("a Lit element's own styles apply once it hydrates, with no inline style refused", async ({
  page,
}) => {
  const refused: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) refused.push(message.text());
  });
  await page.goto(`${origin}/`);
  // Adopted as a constructed sheet into the shadow root the server sent.
  await expect(page.locator("#lit-bump")).toHaveCSS("color", "rgb(120, 0, 120)");
  expect(refused).toEqual([]);
});

test("a deferred assembly is fetched once the page has loaded, then hydrates like any other", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
  const response = await page.request.get(`${origin}/later`);
  // The page the server sends holds the placeholders, not the assemblies.
  const sent = await response.text();
  expect(sent).not.toContain('id="react-bump"');
  expect(sent.match(/data-defer=""/g)).toHaveLength(2);

  await page.goto(`${origin}/later`);
  await expect(page.locator("assembly-root[data-defer]")).toHaveCount(0);
  for (const framework of ["react", "vue"]) {
    const bump = page.locator(`#${framework}-bump`);
    await expect(bump).toHaveText(`${framework} 0`);
    await bump.click();
    await expect(bump).toHaveText(`${framework} 1`);
  }
  expect(errors).toEqual([]);
});

test("a page serves an assembly inside an assembly inside an assembly, whole, before any script", async ({
  page,
}) => {
  const sent = await (await page.request.get(`${origin}/nested`)).text();
  // Every directive a view wrote, by hand or through its slot, was replaced by an envelope.
  expect(sent).not.toMatch(/<assembly[\s>]/);
  expect(sent.match(/<assembly-root /g)).toHaveLength(13);
  // A child's stylesheet is linked by the page that serves it, however deep the child stands.
  expect(sent).toMatch(/<link rel="stylesheet" href="[^"]*vue-counter[^"]*\.css">/);
});

for (const [shell, counter] of NESTED) {
  test(`a ${shell} assembly holds a ${counter} one: both hydrate, and the parent rendering again leaves its child alone`, async ({
    page,
  }) => {
    const problems = problemsOn(page);
    const release = await holdScript(page);
    await page.goto(`${origin}/nested`, { waitUntil: "commit" });
    // Three deep in what the server sent: the html assembly, the shell it placed, its counter.
    const child = page.locator(
      `assembly-root[data-name="html-shell"] assembly-root[data-name="${shell}-shell"] assembly-root[data-name="${counter}-counter"]`,
    );
    await expect(child).toHaveCount(1);
    const bump = child.locator(`#${counter}-bump`);
    await expect(bump).toHaveText(`${counter} 0`);
    await bump.evaluate((element) => ((window as unknown as { kept: Element }).kept = element));
    release();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("script[data-assembly]")).toHaveCount(0);
    await bump.click();
    await expect(bump).toHaveText(`${counter} 1`);
    const parent = page.locator(`#${shell}-shell-bump`);
    await parent.click();
    await parent.click();
    await expect(parent).toHaveText(`${shell} shell 2`);
    // The parent rendered twice more and wrote nothing into its slot: the counter is the element
    // the server sent, still in the page and still counting.
    await expect(bump).toHaveText(`${counter} 1`);
    expect(
      await bump.evaluate(
        (element) =>
          (window as unknown as { kept: Element }).kept === element && element.isConnected,
      ),
    ).toBe(true);
    // One bus for the page, whatever an assembly stands inside.
    for (const [, other] of NESTED.filter(([, name]) => name !== counter)) {
      await expect(page.locator(`#${other}-heard`)).toHaveText(`${counter}-counter`);
    }
    expect(problems).toEqual([]);
  });
}

test("a nested assembly's own styles reach it where it stands", async ({ page }) => {
  await page.goto(`${origin}/nested`);
  // Vue's scoped sheet, linked by the page; Lit's, adopted into the element's own shadow root.
  await expect(page.locator("#vue-bump")).toHaveCSS("color", "rgb(0, 120, 60)");
  await expect(page.locator("#lit-bump")).toHaveCSS("color", "rgb(120, 0, 120)");
});
