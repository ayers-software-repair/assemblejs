// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createServer, defineAssembly } from "../packages/core/dist/index.js";
import type { App } from "../packages/core/dist/index.js";

// THE OUTLINE IN A REAL BROWSER, under the policy every page is sent with. What a DOM shim
// cannot answer is the whole of it: whether a stylesheet linked in a shadow root is allowed,
// whether a box drawn by setting a style property is, where an assembly really stands, and
// whether turning the outline on moves anything on the page.
const ASSETS = "/_assemblejs/assets";
const view = (markup: string | (() => string | Promise<string>)) => ({
  default: { renderer: "html", markup: typeof markup === "string" ? () => markup : markup },
});
const assets = mkdtempSync(join(tmpdir(), "outline-"));
copyFileSync(
  fileURLToPath(new URL("../packages/core/dist/client/index.js", import.meta.url)),
  join(assets, "runtime.js"),
);
// A browser half that counts presses, so a mounted assembly is seen to be live.
writeFileSync(
  join(assets, "app.js"),
  `import { start } from "./runtime.js";
start({ renderers: { html: { mount(element) {
  const button = element.querySelector("button");
  const press = () => { button.textContent = "pressed"; };
  button?.addEventListener("click", press);
  return { unmount: () => button?.removeEventListener("click", press) };
} } } });
`,
);
writeFileSync(
  join(assets, "site.css"),
  "body{margin:0;font:16px/1.5 sans-serif}section{margin:16px;padding:16px;background:#eee}",
);
const live = { css: [], js: [`${ASSETS}/app.js`] };
const assemblies = [
  defineAssembly({ name: "badge", mount: "none", views: view("<b>3 items</b>") }),
  defineAssembly({
    name: "shell",
    mount: "none",
    views: view('<header><assembly name="badge"></assembly></header>'),
  }),
  defineAssembly({
    name: "cart",
    assets: live,
    views: view('<section><h2>Cart</h2><button type="button">Press</button></section>'),
  }),
  defineAssembly({ name: "kept", mount: "none", views: view("<section>Kept</section>") }),
  defineAssembly({
    name: "later",
    assets: live,
    views: view('<section><h2>Later</h2><button type="button">Press</button></section>'),
  }),
  defineAssembly({
    name: "broken",
    views: view(() => {
      throw new Error("connection to postgres://user:hunter2@db refused");
    }),
  }),
  defineAssembly({
    name: "walled",
    mount: "none",
    shadow: true,
    views: view("<section>In a shadow root</section>"),
  }),
];
const pages = [
  {
    route: "/",
    template:
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>outline</title></head><body>' +
      '<assembly name="shell"></assembly><main><assembly name="cart"></assembly>' +
      '<assembly name="kept"></assembly><assembly name="later"></assembly>' +
      '<assembly name="broken"></assembly><assembly name="walled"></assembly></main></body></html>',
    place: {
      kept: { cache: { ttl: 60_000 } },
      later: { defer: true },
      broken: { fallback: "<section>Unavailable</section>" },
    },
  },
];
const serve = (outline: boolean): Promise<App> =>
  createServer({
    config: { mode: "production", host: "127.0.0.1", port: 0, auth: undefined },
    assemblies,
    pages,
    assets,
    styles: [`${ASSETS}/site.css`],
    outline,
    log: () => undefined,
  });

let shown: App | undefined;
let plain: App | undefined;
let page = "";
let without = "";

test.beforeAll(async () => {
  shown = await serve(true);
  plain = await serve(false);
  page = (await shown.listen()).url;
  without = (await plain.listen()).url;
});

test.afterAll(async () => {
  await shown?.close();
  await plain?.close();
  rmSync(assets, { recursive: true, force: true });
});

/** Everything a page said went wrong, a policy's refusal among it. */
const problemsOf = (browser: Page): string[] => {
  const problems: string[] = [];
  browser.on("pageerror", (error) => problems.push(error.message));
  browser.on("console", (message) => {
    const text = message.text();
    if (text.startsWith("Failed to load resource")) return;
    if (message.type() === "error" || message.type() === "warning") problems.push(text);
  });
  browser.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      problems.push(`${String(response.status())} ${response.url()}`);
    }
  });
  return problems;
};
/** Where every element of the page itself stands, the outline's own left out. */
const layout = (browser: Page): Promise<string> =>
  browser.evaluate(() =>
    JSON.stringify(
      [...document.body.querySelectorAll("*")].map((element) => {
        const box = element.getBoundingClientRect();
        return [element.localName, box.left, box.top, box.width, box.height];
      }),
    ),
  );
const drawn = "assemblejs-outline";

test("a page with its outline off until asked is drawn under the default policy, and moves nothing", async ({
  page: browser,
}) => {
  const problems = problemsOf(browser);
  await browser.goto(page);
  await expect(browser.locator('assembly-root[data-name="later"] button')).toBeVisible();
  const outline = browser.locator(drawn);
  await expect(outline.getByRole("button", { name: "Outline" })).toBeVisible();
  await expect(outline.locator(".frame")).toHaveCount(0);
  const before = await layout(browser);

  await outline.getByRole("button", { name: "Outline" }).click();
  await expect(outline.locator(".frame")).toHaveCount(7);
  expect(await layout(browser)).toBe(before);
  // No envelope gained a thing: the outline reads the page and writes only its own element.
  expect(
    await browser.evaluate(() =>
      [...document.querySelectorAll("assembly-root")].flatMap((envelope) =>
        envelope.getAttributeNames().filter((name) => name.includes("outline") || name === "style"),
      ),
    ),
  ).toEqual([]);
  expect(problems).toEqual([]);
});

test("each box stands where its assembly does, and says what answered it and when", async ({
  page: browser,
}) => {
  await browser.goto(page);
  await browser.goto(page);
  const outline = browser.locator(drawn);
  await outline.getByRole("button", { name: "Outline" }).click();
  const chip = (name: string) => outline.locator(".chip").filter({ hasText: name });
  await expect(chip("cart")).toContainText("live");
  await expect(chip("kept")).toContainText("kept");
  await expect(chip("later")).toContainText(/deferred, [\d.]+ m?s, live/);
  await expect(chip("broken")).toContainText("fallback");
  await expect(chip("badge")).toBeVisible();

  // A frame for each, against the element at the top of what the assembly shows.
  const frames = await Promise.all(
    (await outline.locator(".frame").all()).map((frame) => frame.boundingBox()),
  );
  for (const held of [
    'assembly-root[data-name="cart"] > section',
    'assembly-root[data-name="shell"] > header',
    'assembly-root[data-name="walled"] section',
  ]) {
    const want = await browser.locator(held).boundingBox();
    const around = frames.some(
      (frame) =>
        frame !== null &&
        want !== null &&
        (["x", "y", "width", "height"] as const).every(
          (side) => Math.abs(frame[side] - want[side]) <= 1,
        ),
    );
    expect(around, `a frame stands around ${held}`).toBe(true);
  }

  await chip("broken").click();
  const card = outline.locator(".note").filter({ hasText: "broken" }).locator(".card");
  await expect(card).toContainText("a fallback; the failure is logged as");
  expect(await browser.content()).not.toContain("hunter2");
});

test("a visitor's choice holds from page to page, and the page beneath is used as it always is", async ({
  page: browser,
}) => {
  await browser.goto(page);
  const outline = browser.locator(drawn);
  await outline.getByRole("button", { name: "Outline" }).click();
  await browser.reload();
  await expect(outline.getByRole("button", { name: "Outline" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(outline.locator(".frame")).toHaveCount(7);
  // A frame takes no click: the assembly inside it does.
  const press = browser.locator('assembly-root[data-name="cart"] button');
  await expect(browser.locator('assembly-root[data-name="cart"]')).toHaveAttribute(
    "data-mounted",
    "",
  );
  await press.click();
  await expect(press).toHaveText("pressed");
});

test("a server that was not told to show its outline draws none and serves none", async ({
  page: browser,
}) => {
  await browser.goto(without);
  await expect(browser.locator('assembly-root[data-name="later"] button')).toBeVisible();
  await expect(browser.locator(drawn)).toHaveCount(0);
  expect((await browser.request.get(`${without}/_assemblejs/outline.js`)).status()).toBe(404);
});
