// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// B-16 IN A REAL BROWSER, FROM A REAL BUILD: one assembly per framework on one page. Each is
// server-rendered, hydrated by its own renderer, and talks to the others over the page's bus,
// so every framework proves both halves of its renderer and the events binding at once.
const example = fileURLToPath(new URL("../examples/frameworks/", import.meta.url));
const FRAMEWORKS = ["react", "svelte", "preact"] as const;

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
    server?.on("exit", (code) => reject(new Error(`the example exited with ${String(code)}`)));
  });
});

test.afterAll(() => {
  server?.kill();
});

for (const framework of FRAMEWORKS) {
  test(`a ${framework} assembly hydrates the markup the server sent, and is heard by every other`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // A hydration mismatch is reported as a warning or an error, not thrown.
    page.on("console", (message) => {
      const text = message.text();
      if (text.startsWith("Failed to load resource")) return;
      if (message.type() === "error" || message.type() === "warning") errors.push(text);
    });
    page.on("response", (response) => {
      if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
        errors.push(`${String(response.status())} ${response.url()}`);
      }
    });
    await page.goto(`${origin}/`);
    const bump = page.locator(`#${framework}-bump`);
    // Server-rendered: the markup is there before any script runs, and hydration keeps it.
    await expect(bump).toHaveText(`${framework} 0`);
    await expect(page.locator("script[data-assembly]")).toHaveCount(0);
    const before = await bump.evaluate((element) => {
      (window as unknown as { kept: Element }).kept = element;
      return true;
    });
    expect(before).toBe(true);

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
