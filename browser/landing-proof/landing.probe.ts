// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "@playwright/test";
import { serveLanding } from "./serve-landing.js";

test("the landing keeps composition, links and keyboard access at desktop and narrow widths", async ({
  page,
}, info) => {
  const fixture = await serveLanding();
  const failures: string[] = [];
  const fits = () =>
    page.evaluate(() => {
      const heading = document.querySelector("h1");
      return (
        document.documentElement.scrollWidth <= innerWidth &&
        heading !== null &&
        heading.scrollWidth <= heading.clientWidth &&
        [
          ...document.querySelectorAll(".assembly-intro h1, .assembly-example, .assembly-next"),
        ].every((element) => {
          const box = element.getBoundingClientRect();
          return box.left >= 0 && box.right <= innerWidth && box.width > 0;
        })
      );
    });
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${String(response.status())} ${response.url()}`);
  });
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${fixture.origin}/?width=${String(width)}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Frameworks Assemble");
      await expect(page.locator(".assembly-parts li")).toHaveCount(3);
      await expect(page.locator(".assembly-parts li")).toContainText(["Preact", "React", "Vue"]);
      if (width === 1440) {
        await page.locator("h1").evaluate((element) => {
          element.style.width = "200vw";
        });
        expect(await fits()).toBe(false);
        await page.locator("h1").evaluate((element) => {
          element.style.removeProperty("width");
        });
      }
      expect(await fits()).toBe(true);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main")).toBeFocused();
      const screenshot = info.outputPath(`landing-${String(width)}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      await info.attach(`landing-${String(width)}`, { path: screenshot, contentType: "image/png" });
    }
    await page.getByRole("link", { name: "Set up your coding agent" }).click();
    await expect(page).toHaveURL(/\/start\.html#working-with-an-agent$/);
    await expect(page.getByRole("heading", { name: "Working with an agent" })).toBeVisible();
    expect(failures).toEqual([]);
  } finally {
    try {
      await page.close();
    } finally {
      await fixture.close();
    }
  }
});
