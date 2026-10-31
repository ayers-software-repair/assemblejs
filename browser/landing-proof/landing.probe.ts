// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { captureLandingPaint } from "./capture-landing-paint.js";
import { observeLandingLifecycle } from "./observe-landing-lifecycle.js";
import { serveLanding } from "./serve-landing.js";

test("the landing keeps composition, links and keyboard access at desktop and narrow widths", async ({
  page,
}, info) => {
  const fixture = await serveLanding();
  const failures: string[] = [];
  const renderers: Array<{
    width: number;
    renderer: string;
    thread: string;
    edges: number;
    maxDelta: number;
    paintWidth: number;
    paintHeight: number;
    lifecycle: string;
  }> = [];
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
    await observeLandingLifecycle(page);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${fixture.origin}/?width=${String(width)}`);
      await page.evaluate(() => document.activeViewTransition?.finished);
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
      const measured = {
        width,
        renderer: "pending",
        thread: "none",
        edges: 0,
        maxDelta: 0,
        paintWidth: 0,
        paintHeight: 0,
        lifecycle: "[]",
      };
      renderers.push(measured);
      const screenshot = info.outputPath(`landing-${String(width)}.png`);
      const capture = async () => {
        const { image, ...pixels } = await captureLandingPaint(page);
        const native = await page.locator("[data-landing-background]").evaluate((canvas) => ({
          renderer: (canvas as HTMLElement).dataset.renderer ?? "pending",
          thread: (canvas as HTMLElement).dataset.thread ?? "none",
          lifecycle: document.documentElement.dataset.landingLifecycle ?? "[]",
        }));
        Object.assign(measured, pixels, native);
        await writeFile(screenshot, image);
        return ["webgpu", "webgl"].includes(native.renderer) ? pixels.edges : 0;
      };
      await expect.poll(capture, { timeout: 15000 }).toBeGreaterThanOrEqual(12);
      if (width === 1440) {
        const canvas = page.locator("[data-landing-background]");
        const original = await canvas.evaluate((element) => {
          const style = (element as HTMLElement).style;
          const saved = {
            value: style.getPropertyValue("opacity"),
            priority: style.getPropertyPriority("opacity"),
          };
          style.setProperty("opacity", "0", "important");
          return saved;
        });
        try {
          await expect
            .poll(
              async () => {
                const blank = await captureLandingPaint(page);
                await writeFile(info.outputPath("landing-unpainted-control.png"), blank.image);
                const { image: _image, ...pixels } = blank;
                await writeFile(
                  info.outputPath("landing-unpainted-control.json"),
                  JSON.stringify(pixels, null, 2),
                );
                return blank.edges;
              },
              { timeout: 5000 },
            )
            .toBeLessThan(12);
        } finally {
          await canvas.evaluate((element, saved) => {
            const style = (element as HTMLElement).style;
            if (saved.value) style.setProperty("opacity", saved.value, saved.priority);
            else style.removeProperty("opacity");
          }, original);
        }
        await expect.poll(capture, { timeout: 15000 }).toBeGreaterThanOrEqual(12);
      }
      expect(measured.paintWidth).toBe(width);
      expect(measured.paintHeight).toBe(900);
      await info.attach(`landing-${String(width)}`, { path: screenshot, contentType: "image/png" });
      // Full-height images document layout only; the exact viewport PNG above proves paint.
      await page.screenshot({
        path: info.outputPath(`landing-${String(width)}-layout.png`),
        fullPage: true,
        scale: "css",
      });
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main")).toBeFocused();
    }
    for (let visit = 0; visit < 3; visit += 1) {
      await page.getByRole("link", { name: "Set up your coding agent" }).click();
      await expect(page).toHaveURL(/\/start\.html#working-with-an-agent$/);
      await page.evaluate(() => document.activeViewTransition?.finished);
      await expect(page.getByRole("heading", { name: "Working with an agent" })).toBeVisible();
      if (visit < 2) {
        await page.getByRole("link", { name: "AssembleJS home", exact: true }).click();
        await page.evaluate(() => document.activeViewTransition?.finished);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("Frameworks Assemble");
      }
    }
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("landing-renderers.json"),
        JSON.stringify(renderers, null, 2),
      );
    } finally {
      try {
        await page.close();
      } finally {
        await fixture.close();
      }
    }
  }
});
