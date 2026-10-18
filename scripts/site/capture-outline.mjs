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
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { serve } from "../../conformance/harness/serve.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = `${root}site/docs/img/outline.png`;
const sealed = process.argv[2];
const servers = [];

const fail = async (reason) => {
  console.error(`capture-outline: ${reason}`);
  await stopAll();
  process.exit(1);
};

/** Starts one team's built server through the conformance harness and answers its origin. */
const start = async (team, environment = {}) =>
  (await serve(`${root}examples/market/${team}/`, environment, (server) => servers.push(server)))
    .origin;

/** Stops every server this run started and removes the logs the harness kept beside them. */
const stopAll = async () => {
  for (const server of servers) await server.stop();
  for (const server of servers) rmSync(server.log, { force: true });
};

if (!sealed) await fail("usage: capture-outline.mjs <path to sealed-chrome.sh>");

try {
  // The launcher names the sealed browser's binary; the empty environment below is its seal.
  const executablePath = execFileSync(sealed, ["--which"], { encoding: "utf8" }).trim();
  const teams = {
    CATALOG_ORIGIN: await start("catalog"),
    REVIEWS_ORIGIN: await start("reviews"),
    FULFILMENT_ORIGIN: await start("fulfilment"),
  };
  const shop = await start("shop", { ...teams, STAFF_KEY: "capture-run-only" });
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--ozone-platform=headless"],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: "C.UTF-8",
      TMPDIR: process.env.TMPDIR ?? "/tmp",
    },
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
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
  await fail(String(error.message ?? error).split("\n")[0]);
}
await stopAll();
