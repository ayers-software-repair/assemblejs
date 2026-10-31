// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { freePort, saidBy } from "./child-server.js";
import { exerciseMarketEstimate } from "./market-estimate.js";
import { clickMounted } from "./mounted.js";

// THE SHOWCASE, WALKED AS A VISITOR WALKS IT. Four servers from four builds, each a team's own
// project, and one shop whose every page is composed from them. What only a browser and four
// real servers can say: that a page of thirteen assemblies from three origins hydrates whole,
// that two servers' assemblies agree through the address, that an order crosses three servers,
// and that a page says so, or fails whole, when a server is down.
const market = (team: string): string =>
  fileURLToPath(new URL(`../examples/market/${team}/`, import.meta.url));
const STAFF_KEY = "a-key-for-this-run-only";

// One worker walks the whole file: the four servers hold a shop's state, and an order one case
// places is the stock the next one reads.
test.describe.configure({ mode: "serial" });

const running: ChildProcess[] = [];
/** Starts one team's built server on a port of its own, and answers its origin once it listens. */
const serve = async (team: string, environment: Record<string, string> = {}): Promise<string> => {
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: market(team),
    env: { ...process.env, ...environment, ASSEMBLEJS_PORT: await freePort() },
    stdio: ["ignore", "pipe", "pipe"],
  });
  running.push(child);
  return new Promise<string>((resolve, reject) => {
    child.stdout?.on("data", (chunk: Buffer) => {
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found?.[1] !== undefined) resolve(found[1]);
    });
    child.on("exit", (code) =>
      reject(new Error(`${team} exited with ${String(code)}${saidBy(child)}`)),
    );
  });
};

let teams = { CATALOG_ORIGIN: "", REVIEWS_ORIGIN: "", FULFILMENT_ORIGIN: "" };
let shop = "";

test.beforeAll(async () => {
  teams = {
    CATALOG_ORIGIN: await serve("catalog"),
    REVIEWS_ORIGIN: await serve("reviews"),
    FULFILMENT_ORIGIN: await serve("fulfilment"),
  };
  shop = await serve("shop", { ...teams, STAFF_KEY });
});

test.afterAll(() => {
  for (const child of running) child.kill();
});

/** Everything a page said went wrong. */
const problemsOf = (page: Page): string[] => {
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
const envelope = (page: Page, name: string) => page.locator(`assembly-root[data-name="${name}"]`);

test("a product page is thirteen assemblies from three servers, each hydrated by its own", async ({
  page,
}) => {
  const problems = problemsOf(page);
  await page.goto(`${shop}/p/kb-guji-250`);
  await expect(page.locator("assembly-root")).toHaveCount(13);
  for (const [name, origin] of [
    ["product-detail", teams.CATALOG_ORIGIN],
    ["roast-meter", teams.CATALOG_ORIGIN],
    ["product-facts", teams.CATALOG_ORIGIN],
    ["rating", teams.REVIEWS_ORIGIN],
    ["review-list", teams.REVIEWS_ORIGIN],
  ] as const) {
    await expect(envelope(page, name), name).toHaveAttribute("data-remote", origin);
  }
  for (const name of ["buy-box", "price-calculator", "site-header", "basket-count"]) {
    await expect(envelope(page, name), name).not.toHaveAttribute("data-remote");
  }
  for (const live of ["search-box", "basket-count", "product-detail", "roast-meter", "buy-box"]) {
    await expect(envelope(page, live), live).toHaveAttribute("data-mounted", "");
  }
  // A Lit element whose steps are a property its view sets: drawn once, the right one lit.
  await expect(page.locator("roast-meter li")).toHaveCount(3);
  await expect(page.locator('roast-meter li[aria-current="true"]')).toHaveText("light");
  await expect(page.locator("star-rating span")).toHaveText("4.7 from 3 reviews");
  await expect(envelope(page, "review-list").locator(".review")).toHaveCount(3);
  // The one the browser asks for after the page has loaded, and no fallback anywhere.
  await expect(envelope(page, "recently-viewed")).not.toHaveAttribute("data-defer");
  await expect(page.locator("assembly-root[data-failed]")).toHaveCount(0);
  // Each server's Lit hydrates that server's elements: Lit leaves its part on what it hydrated,
  // an instance of its own copy's class, so an element's shadow root and its view's envelope
  // hold parts of one copy, and the three servers' copies are three.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const copies: unknown[] = [];
        const copyOf = (node: Node | null | undefined): number => {
          const part = (node as { _$litPart$?: object } | null | undefined)?._$litPart$;
          if (part === undefined) return -1;
          const copy = Object.getPrototypeOf(part) as unknown;
          if (!copies.includes(copy)) copies.push(copy);
          return copies.indexOf(copy);
        };
        return [
          ["basket-count", "basket-count"],
          ["roast-meter", "roast-meter"],
          ["rating", "star-rating"],
        ].map(([name, tag]) => {
          const envelope = document.querySelector(`assembly-root[data-name="${name ?? ""}"]`);
          const view = envelope?.shadowRoot ?? envelope;
          return {
            view: copyOf(view),
            element: copyOf(view?.querySelector(tag ?? "")?.shadowRoot),
          };
        });
      }),
    )
    .toEqual([
      { view: 0, element: 0 },
      { view: 1, element: 1 },
      { view: 2, element: 2 },
    ]);
  expect(problems).toEqual([]);
});

test("the calculator uses real quotes, preserves errors and fits a narrow page", async ({
  page,
}, info) => {
  await exerciseMarketEstimate(page, shop, info);
});

test("a view that renders nothing is placed from another server like any other", async ({
  page,
}) => {
  // A kettle has no roast: the catalogue's Lit view renders an empty template for it.
  await page.goto(`${shop}/p/br-kettle-900`);
  await expect(envelope(page, "roast-meter")).toHaveAttribute("data-mounted", "");
  await expect(envelope(page, "roast-meter")).not.toHaveAttribute("data-failed");
  await expect(page.locator("roast-meter")).toHaveCount(0);
});

test("two assemblies of one server talk over its bus on another server's page", async ({
  page,
}) => {
  await page.goto(`${shop}/c/beans`);
  await expect(page.locator(".shelf-count")).toHaveText("4 of 4 shown");
  await expect(envelope(page, "facets")).toHaveAttribute("data-mounted", "");
  await expect(envelope(page, "product-grid")).toHaveAttribute("data-mounted", "");
  await page.getByLabel("Light").check();
  await expect(page.locator(".shelf-count")).toHaveText("1 of 4 shown");
  await expect(page.locator(".card-name")).toHaveText(["Guji Natural, Ethiopia"]);
});

test("a choice made in one server's assembly reaches another's through the address", async ({
  page,
}) => {
  await page.goto(`${shop}/p/kb-gayo-250`);
  await expect(page.locator(".buy-grind")).toHaveText("Ground for: Whole bean");
  await expect(envelope(page, "product-detail")).toHaveAttribute("data-mounted", "");
  await page.getByLabel("Ground for").selectOption("Espresso");
  await page.waitForURL(/\?grind=Espresso$/);
  await expect(page.getByLabel("Ground for")).toHaveValue("Espresso");
  await expect(page.locator(".buy-grind")).toHaveText("Ground for: Espresso");
});

test("an order is priced by the shop, taken off its shelves and followed by fulfilment", async ({
  page,
}) => {
  const problems = problemsOf(page);
  await page.goto(`${shop}/p/br-kettle-900`);
  await expect(page.locator(".buy-left")).toHaveText("4 in stock");
  await clickMounted(page.getByRole("button", { name: "Add to basket" }));
  await clickMounted(page.getByRole("button", { name: "Add to basket" }));
  // Said by a React assembly, heard by a Lit one, both the shop's own.
  await expect(page.locator("basket-count span")).toHaveText("2");

  await page.goto(`${shop}/basket`);
  await expect(page.locator(".basket tbody tr")).toHaveCount(1);
  await expect(page.locator(".basket tfoot")).toContainText("$128.00");
  await expect(page.locator("basket-count span")).toHaveText("2");

  await page.goto(`${shop}/checkout`);
  await expect(envelope(page, "checkout-form")).toHaveAttribute("data-mounted", "");
  await page.getByLabel("Who is it for").fill("Ada");
  await page.getByLabel("Town or city").fill("Leeds");
  await page.getByRole("button", { name: "Place the order" }).click();
  await page.waitForURL(/\/orders\/[0-9a-f-]{36}$/);
  await expect(page.locator("#order-title")).toHaveText("Thank you, Ada");
  await expect(page.locator(".order tfoot")).toContainText("$128.00");
  // The fulfilment team's server was told of the order by the shop's, and answers for it here.
  await expect(envelope(page, "shipment-progress")).toHaveAttribute(
    "data-remote",
    teams.FULFILMENT_ORIGIN,
  );
  await expect(page.locator('.shipment-steps li[aria-current="step"]')).toHaveText(
    "Order received",
  );
  await expect(page.locator("basket-count span")).toHaveText("0");

  await page.goto(`${shop}/p/br-kettle-900`);
  await expect(page.locator(".buy-left")).toHaveText("Only 2 left");
  expect(problems).toEqual([]);
});

test("staff sign in by the shop's own check, and the board hears the stock change", async ({
  page,
}) => {
  expect((await page.request.get(`${shop}/staff/stock`)).status()).toBe(401);
  expect(
    (
      await page.request.post(`${shop}/api/restock`, { data: { sku: "gr-brush", left: 1 } })
    ).status(),
  ).toBe(401);
  await page.goto(`${shop}/staff`);
  await expect(envelope(page, "staff-door")).toHaveAttribute("data-mounted", "");
  await page.getByLabel("Staff key").fill("not the key");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".door-said")).toHaveText("That is not the staff key.");
  await page.getByLabel("Staff key").fill(STAFF_KEY);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/staff\/stock$/);
  await expect(envelope(page, "stock-board")).toHaveAttribute("data-mounted", "");
  const press = page.locator(".board tbody tr").filter({ hasText: "br-press-600" });
  await expect(press.locator("td").first()).toHaveText("0");
  await press.getByRole("spinbutton").fill("7");
  await press.getByRole("button", { name: "Set" }).click();
  // The level comes back over the page's stream, onto its bus, and the row hears it.
  await expect(press.locator("td").first()).toHaveText("7");
});

test("a page says so when a server it can do without is down, and fails whole without one it needs", async ({
  page,
}) => {
  const nobody = `http://127.0.0.1:${await freePort()}`;
  const without = await serve("shop", { ...teams, REVIEWS_ORIGIN: nobody, STAFF_KEY });
  await page.goto(`${without}/p/kb-guji-250`);
  await expect(envelope(page, "review-list")).toHaveAttribute("data-failed", /.+/);
  await expect(envelope(page, "review-list")).toContainText("Reviews are unavailable right now.");
  await expect(envelope(page, "product-detail")).toHaveAttribute("data-mounted", "");
  await expect(page.getByRole("button", { name: "Add to basket" })).toBeEnabled();

  const needed = await serve("shop", { ...teams, CATALOG_ORIGIN: nobody, STAFF_KEY });
  expect((await page.request.get(`${needed}/p/kb-guji-250`)).status()).toBe(503);
  const shelf = await page.request.get(`${needed}/c/beans`);
  expect(shelf.status()).toBe(200);
  expect(await shelf.text()).toContain("The shelves are not answering just now.");
});

test("the outline boxes every assembly of a page from three servers, each by what answered it", async ({
  page,
}) => {
  await page.goto(`${shop}/p/kb-guji-250`);
  const outline = page.locator("assemblejs-outline");
  await outline.getByRole("button", { name: "Outline" }).click();
  await expect(outline.locator(".frame")).toHaveCount(13);
  const tone = (name: string) =>
    outline.locator(".note").filter({ has: page.locator(".chip b", { hasText: name }) });
  await expect(tone("buy-box")).toHaveAttribute("data-tone", "local");
  await expect(tone("product-detail")).toHaveAttribute("data-tone", "remote");
  await expect(tone("review-list")).toHaveAttribute("data-tone", "remote");
  await expect(tone("recently-viewed")).toHaveAttribute("data-tone", "deferred");
  await expect(outline.locator(".sum")).toContainText("/p/:sku: 13 assemblies, composed in");
});
