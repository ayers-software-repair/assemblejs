// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { serveLanding } from "./serve-landing.js";

test("a cached legacy logo cannot replace the selected rounded image", async ({ page }, info) => {
  const fixture = await serveLanding();
  const brand = JSON.parse(await readFile("site-source/pages.json", "utf8")) as { mark: string };
  try {
    await page.goto(fixture.origin + "/previous-logo.html");
    await expect(page.locator(".product-brand img")).toHaveAttribute("src", "mark.svg");
    await expect(page.locator(".product-brand img")).toHaveJSProperty("complete", true);
    expect(
      await page
        .locator(".product-brand img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
    const oldRequests = fixture.requests.filter((url) => url === "/mark.svg").length;
    expect(oldRequests).toBeGreaterThan(0);
    await page.goto(fixture.origin + "/previous-logo.html?visit=2");
    await expect(page.locator(".product-brand img")).toHaveAttribute("src", "mark.svg");
    await expect(page.locator(".product-brand img")).toHaveJSProperty("complete", true);
    expect(
      await page
        .locator(".product-brand img")
        .evaluate((image) => (image as HTMLImageElement).naturalWidth),
    ).toBeGreaterThan(0);
    expect(fixture.requests.filter((url) => url === "/mark.svg")).toHaveLength(oldRequests);

    const response = page.waitForResponse(
      (item) => item.url() === fixture.origin + "/" + brand.mark,
    );
    await page.goto(fixture.origin);
    expect(
      createHash("sha256")
        .update(await (await response).body())
        .digest("hex"),
    ).toBe("bc2a8e621dba657c8358b7f34a3a00a8bdc8a5d70cb6eda04dce545490dff008");
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const selector of [".product-brand img", ".assembly-wordmark img"]) {
        const logo = page.locator(selector);
        await expect(logo).toHaveAttribute("src", brand.mark);
        await expect(logo).toHaveJSProperty("naturalWidth", 1330);
        await expect(logo).toHaveJSProperty("naturalHeight", 1182);
        await expect(logo).toHaveCSS("object-fit", "contain");
        await expect(logo).toBeVisible();
      }
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", brand.mark);
      await page.screenshot({ path: info.outputPath(`rounded-logo-${String(width)}.png`) });
    }
    expect(fixture.requests.filter((url) => url === "/mark.svg")).toHaveLength(oldRequests);
  } finally {
    await fixture.close();
  }
});
