// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { frameAssetProblems } from "../../scripts/site-frame-assets.mjs";
import { serveLanding } from "./serve-landing.js";

test("original identity covers maintained pages and every generated reference family", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const fixture = await serveLanding();
  const failures: string[] = [];
  let maintained: string[] = [];
  let references: string[] = [];
  let captures: string[] = [];
  const families = new Map<string, string>();
  try {
    const inventory = JSON.parse(await readFile("site/pages.json", "utf8")) as {
      pages: Array<{ file: string; generated?: boolean }>;
    };
    maintained = inventory.pages.filter((entry) => !entry.generated).map((entry) => entry.file);
    references = (await readdir("site/docs/api", { recursive: true }))
      .filter((file) => file.endsWith(".html"))
      .sort();
    for (const file of references) {
      const html = await readFile(join("site/docs/api", file), "utf8");
      expect(html).toContain('class="product-site page-reference"');
      expect(frameAssetProblems(html, "docs/api/" + file, "site")).toEqual([]);
      const family = file.includes("/") ? file.split("/")[0] : "root";
      if (!families.has(family)) families.set(family, file);
    }
    expect(maintained).toHaveLength(17);
    expect(references.length).toBeGreaterThan(0);
    expect([...families.keys()].sort()).toEqual([
      "classes",
      "functions",
      "interfaces",
      "modules",
      "root",
      "types",
      "variables",
    ]);
    captures = [
      ...maintained,
      ...[
        ...new Set([...families.values(), ...references.filter((file) => !file.includes("/"))]),
      ].map((file) => "docs/api/" + file),
    ];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(message.text());
    });
    page.on("requestfailed", (request) =>
      failures.push(request.url() + ": " + request.failure()?.errorText),
    );
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(String(response.status()) + " " + response.url());
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [index, file] of captures.entries()) {
        await page.goto(fixture.origin + "/" + file);
        await page.evaluate(() => document.fonts.ready);
        const brand = page.getByRole("link", { name: "AssembleJS home", exact: true });
        await expect(brand).toHaveCount(1);
        await expect(brand).toBeVisible();
        expect(
          await brand.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0);
        if (width === 1440 && index === 0) {
          await page.locator("body").evaluate((body) => {
            body.style.width = "200vw";
          });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(false);
          await page.locator("body").evaluate((body) => {
            body.style.removeProperty("width");
          });
        }
        const type = await page.evaluate(() => ({
          family: getComputedStyle(document.body).fontFamily,
          loaded: [...document.fonts].some(
            (font) => /^"?Poppins"?$/.test(font.family) && font.status === "loaded",
          ),
          fits: document.documentElement.scrollWidth <= innerWidth,
        }));
        expect(type.family).toContain("Poppins");
        expect(type.loaded).toBe(true);
        expect(type.fits).toBe(true);
        await page.screenshot({
          path: info.outputPath(`page-${String(index)}-${String(width)}.png`),
          fullPage: true,
        });
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
    await page.goto(fixture.origin + "/index.html");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    await page.screenshot({ path: info.outputPath("forced-colors-focus.png"), fullPage: true });
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("site-pages-evidence.json"),
        JSON.stringify(
          { maintained, references, families: Object.fromEntries(families), captures, failures },
          null,
          2,
        ),
      );
    } finally {
      await fixture.close();
    }
  }
});
