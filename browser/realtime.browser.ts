// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// B-18 IN A REAL BROWSER, FROM A REAL BUILD: a server push over the page's one stream reaches a
// React assembly and a Svelte assembly, each of which only listens on the page's bus.
const example = fileURLToPath(new URL("../examples/realtime/", import.meta.url));

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

test("a server push reaches a React and a Svelte assembly through the page's bus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // The browser's own request for a favicon, which the example does not serve.
    if (message.text().startsWith("Failed to load resource")) return;
    if (message.type() === "error") errors.push(message.text());
  });
  const streams: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/prices") streams.push(request.url());
  });

  await page.goto(`${origin}/`);
  for (const id of ["#react-price", "#svelte-price"]) {
    await expect(page.locator(id)).toHaveAttribute("data-ready", "");
    await expect(page.locator(id)).toHaveText("waiting");
  }
  // The page's connection may still be opening: push until the server says a page heard it.
  await expect
    .poll(async () => {
      const answer = await page.request.post(`${origin}/api/push`, { data: { price: 42 } });
      return ((await answer.json()) as { reached: number }).reached;
    })
    .toBe(1);
  for (const id of ["#react-price", "#svelte-price"]) {
    await expect(page.locator(id)).toHaveText('{"price":42}');
  }
  // One connection for the page, not one per assembly.
  expect(streams).toHaveLength(1);
  expect(errors).toEqual([]);
});
