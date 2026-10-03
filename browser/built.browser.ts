// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// THE DAY-ONE PROOF, FROM A REAL BUILD. The fixture tests hand the runtime markup written for
// them; this one builds the two-framework example with the command line, starts dist/server.js
// with plain node, and drives the page that server composes. What chromium runs here is what a
// project ships: the composed document, the hoisted module, and each island's own chunk.
const example = fileURLToPath(new URL("../examples/two-frameworks/", import.meta.url));
const cli = fileURLToPath(new URL("../packages/cli/dist/bin.js", import.meta.url));

let server: ChildProcess | undefined;
let origin = "";

test.beforeAll(async () => {
  execFileSync(process.execPath, [cli, "build"], { cwd: example, stdio: "pipe" });
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
    server?.on("exit", (code) => reject(new Error(`the built server exited with ${String(code)}`)));
  });
});

test.afterAll(() => {
  server?.kill();
});

test("a built project's Svelte and React assemblies share a page and an event", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/`);

  // Server-rendered before any script runs: both frameworks' markup is in the document.
  await expect(page.locator("#bump")).toContainText("Clicked 0");
  await expect(page.locator("#readout")).toHaveText("nothing yet");

  // Every island is read and removed once the runtime starts, the static assembly's included.
  await expect(page.locator("script[data-assembly]")).toHaveCount(0);

  await page.locator("#bump").click();
  await expect(page.locator("#bump")).toContainText("Clicked 1");
  await expect(page.locator("#readout")).toHaveText("counter counted 1");
  expect(errors).toEqual([]);
});
