// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { createServer } from "../packages/core/dist/index.js";
import type { App } from "../packages/core/dist/index.js";

// B-13 IN A REAL BROWSER. A page on one server places two assemblies served by another: the
// built two-framework example. The consumer has no browser code of its own; the producer's
// script arrives through its manifest, loads cross-origin as a module, and mounts exactly the
// envelopes marked with its origin. A shim cannot answer this: it is CORS, cross-origin module
// loading and two runtimes sharing one document.
const example = fileURLToPath(new URL("../examples/two-frameworks/", import.meta.url));

let producer: ChildProcess | undefined;
let consumer: App | undefined;
let page = "";

test.beforeAll(async () => {
  const port = String(20000 + Math.floor(Math.random() * 20000));
  producer = spawn(process.execPath, ["dist/server.js"], {
    cwd: example,
    env: { ...process.env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const origin = await new Promise<string>((resolve, reject) => {
    producer?.stdout?.on("data", (chunk: Buffer) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found?.[1] !== undefined) resolve(found[1]);
    });
    producer?.on("exit", (code) => reject(new Error(`the producer exited with ${String(code)}`)));
  });
  consumer = await createServer({
    config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
    assemblies: [],
    remotes: [{ origin }],
    pages: [
      {
        route: "/",
        template:
          '<!doctype html><html><head><title>remote</title></head><body><assembly name="counter"></assembly><assembly name="readout"></assembly></body></html>',
        place: {
          counter: { url: `${origin}/assembly/counter/` },
          readout: { url: `${origin}/assembly/readout/` },
        },
      },
    ],
  });
  page = (await consumer.listen()).url;
});

test.afterAll(async () => {
  await consumer?.close();
  producer?.kill();
});

test("a page hydrates assemblies another server rendered, with that server's own script", async ({
  page: browser,
}) => {
  const errors: string[] = [];
  browser.on("pageerror", (error) => errors.push(error.message));
  browser.on("console", (message) => {
    if (message.type() === "warning") errors.push(message.text());
  });
  // Every resource the page asked for answered, the cross-origin module and its chunks included;
  // the browser's own request for a site icon is the one thing no assembly asked for.
  browser.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      errors.push(`${String(response.status())} ${response.url()}`);
    }
  });
  await browser.goto(`${page}/`);

  await expect(browser.locator("#bump")).toContainText("Clicked 0");
  await expect(browser.locator("assembly-root[data-remote]")).toHaveCount(2);
  await expect(browser.locator('script[type="module"]')).toHaveCount(1);

  await browser.locator("#bump").click();
  await expect(browser.locator("#bump")).toContainText("Clicked 1");
  await expect(browser.locator("#readout")).toHaveText("counter counted 1");
  expect(errors).toEqual([]);
});
