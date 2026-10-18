// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Captures the outline overlay on the market product page into site/docs/img/outline.png.
// Starts the four built market servers, opens the shop's product page in the sealed browser,
// presses Outline, waits for the boxes to be drawn, and saves the viewport. Exits 1 with one
// line on any failure.
//
//   node scripts/site/capture-outline.mjs <path to sealed-chrome.sh>
//
// Build first: pnpm build, then `node packages/cli/dist/bin.js build --cwd examples/market/<team>`
// for catalog, reviews, fulfilment and shop.
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createServer } from "node:net";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = `${root}site/docs/img/outline.png`;
const sealed = process.argv[2];
const children = [];

const fail = (reason) => {
  console.error(`capture-outline: ${reason}`);
  for (const child of children) child.kill();
  process.exit(1);
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(String(port)));
    });
  });

/** Starts one team's built server and answers its origin once it says it is listening. */
const serve = async (team, environment = {}) => {
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: `${root}examples/market/${team}/`,
    env: { ...process.env, ...environment, ASSEMBLEJS_PORT: await freePort() },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${team} did not listen in 20 s`)), 20_000);
    child.stdout.on("data", (chunk) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found) {
        clearTimeout(timer);
        resolve(found[1]);
      }
    });
    child.on("exit", (code) => reject(new Error(`${team} exited with ${String(code)}; is it built?`)));
  });
};

if (!sealed) fail("usage: capture-outline.mjs <path to sealed-chrome.sh>");

try {
  // The launcher names the sealed browser's binary; the empty environment below is its seal.
  const executablePath = execFileSync(sealed, ["--which"], { encoding: "utf8" }).trim();
  const teams = {
    CATALOG_ORIGIN: await serve("catalog"),
    REVIEWS_ORIGIN: await serve("reviews"),
    FULFILMENT_ORIGIN: await serve("fulfilment"),
  };
  const shop = await serve("shop", { ...teams, STAFF_KEY: "capture-run-only" });
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--ozone-platform=headless"],
    env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: "C.UTF-8", TMPDIR: process.env.TMPDIR ?? "/tmp" },
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await page.goto(`${shop}/p/kb-guji-250`);
    await page.locator("assembly-root").first().waitFor();
    // The outline is one assemblejs-outline element with a root of its own; its switch is
    // the "Outline" button and each box it draws is a .frame.
    const outline = page.locator("assemblejs-outline");
    await outline.getByRole("button", { name: "Outline" }).click();
    await outline.locator(".frame").first().waitFor({ timeout: 10_000 });
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out });
    console.log(`wrote ${out}`);
  } finally {
    await browser.close();
  }
} catch (error) {
  fail(String(error.message ?? error).split("\n")[0]);
}
for (const child of children) child.kill();
