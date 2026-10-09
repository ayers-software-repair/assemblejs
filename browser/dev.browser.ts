// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { freePort, saidBy } from "./child-server.js";

// THE DEV LOOP IN A REAL BROWSER: `assemblejs dev` serves a copy of an example, a source file is
// edited, and the open page reloads itself onto the rebuilt server, with no hand on the browser.
const root = fileURLToPath(new URL("..", import.meta.url));
const example = join(root, "examples", "two-frameworks");

let dev: ChildProcess | undefined;
let project = "";

test.afterAll(async () => {
  if (dev !== undefined && dev.exitCode === null) {
    const ended = new Promise((resolve) => dev?.once("exit", resolve));
    dev.kill("SIGINT");
    await ended;
  }
  if (project !== "") rmSync(project, { recursive: true, force: true });
});

test("a page under dev reloads itself after a source file changes", async ({ page }) => {
  test.setTimeout(90_000);
  // Nested in the example, so the copy resolves the example's installed packages.
  project = mkdtempSync(join(example, ".dev-reload-"));
  cpSync(join(example, "src"), join(project, "src"), { recursive: true });
  writeFileSync(join(project, "package.json"), "{}");
  const port = await freePort();
  dev = spawn(process.execPath, [join(root, "packages/cli/dist/bin.js"), "dev", "--cwd", project], {
    env: { ...process.env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const origin = await new Promise<string>((resolve, reject) => {
    dev?.stdout?.on("data", (chunk: Buffer) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found?.[1] !== undefined) resolve(found[1]);
    });
    dev?.on("exit", (code) => reject(new Error(`dev exited with ${String(code)}${saidBy(dev)}`)));
  });

  // The page has heard the first server's boot before anything changes.
  const connected = page.waitForResponse((response) =>
    response.url().endsWith("/_assemblejs/devtools/reload"),
  );
  await page.goto(`${origin}/`);
  await expect(page.locator("h1")).toHaveText("Two frameworks, one page");
  await connected;
  // The page carries the boot of the server that rendered it, so it does not reload while that
  // server answers.
  let loads = 0;
  page.on("load", () => (loads += 1));
  await page.waitForTimeout(1500);
  expect(loads).toBe(0);
  writeFileSync(join(project, "src", "assemblies", "hello", "hello.html"), "<h1>Rebuilt</h1>\n");
  await expect(page.locator("h1")).toHaveText("Rebuilt", { timeout: 60_000 });

  // Devtools, read-only, under the page's own content security policy: the overview names what
  // the server was built from, and its stylesheet is a file the policy allows.
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${origin}/_assemblejs/devtools/`);
  await expect(page.locator("h1")).toHaveText("AssembleJS devtools");
  await expect(page.locator("table").first()).toContainText("counter");
  expect(await page.locator("body").evaluate((body) => getComputedStyle(body).margin)).toBe("32px");
  expect(errors).toEqual([]);
});
