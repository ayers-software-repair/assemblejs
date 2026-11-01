// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { compareLandingPaint } from "./compare-landing-paint.js";
import { serveLanding } from "./serve-landing.js";

test("original static background paints at every supported width without a canvas runtime", async ({
  page,
}, info) => {
  const fixture = await serveLanding();
  const failures: string[] = [];
  const backgroundRuntime: string[] = [];
  const measurements: Array<{
    width: number;
    differentPixels: number;
    paintWidth: number;
    paintHeight: number;
  }> = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`${String(response.status())} ${response.url()}`);
  });
  page.on("requestfailed", (request) =>
    failures.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on("request", (request) => {
    if (/\/kit\/landing-(background|worker|renderers|shaders)\.js(?:\?|$)/.test(request.url()))
      backgroundRuntime.push(request.url());
  });
  page.on("worker", (worker) => backgroundRuntime.push(worker.url()));
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${fixture.origin}/?width=${String(width)}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Frameworks Assemble");
      await expect(page.locator(".assembly-parts li")).toHaveCount(3);
      await expect(page.locator(".assembly-parts li")).toContainText(["Preact", "React", "Vue"]);
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const reference = await page.screenshot({ scale: "css" });
      await writeFile(info.outputPath(`landing-${String(width)}.png`), reference);
      const world = page.locator(".product-world");
      const original = await world.evaluate((element) => {
        const style = (element as HTMLElement).style;
        const saved = {
          value: style.getPropertyValue("background"),
          priority: style.getPropertyPriority("background"),
        };
        style.setProperty("background", "var(--surface)", "important");
        return saved;
      });
      try {
        const { image, ...pixels } = await compareLandingPaint(page, reference);
        expect(pixels.paintWidth).toBe(width);
        expect(pixels.paintHeight).toBe(900);
        expect(pixels.differentPixels).toBeGreaterThan(100);
        measurements.push({ width, ...pixels });
        await writeFile(
          info.outputPath(`landing-${String(width)}-decoration-removed-control.png`),
          image,
        );
        expect((await compareLandingPaint(page, image)).differentPixels).toBe(0);
      } finally {
        await world.evaluate((element, saved) => {
          const style = (element as HTMLElement).style;
          if (saved.value) style.setProperty("background", saved.value, saved.priority);
          else style.removeProperty("background");
        }, original);
      }
      expect((await compareLandingPaint(page, reference)).differentPixels).toBe(0);
      await page.screenshot({
        path: info.outputPath(`landing-${String(width)}-layout.png`),
        fullPage: true,
        scale: "css",
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(fixture.origin);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(backgroundRuntime).toEqual([]);
    await page.getByRole("link", { name: "Inspect a composed page", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("See how a page is composed");
    expect(failures).toEqual([]);
  } finally {
    try {
      await writeFile(
        info.outputPath("landing-evidence.json"),
        JSON.stringify({ measurements, backgroundRuntime, failures }, null, 2),
      );
    } finally {
      await fixture.close();
    }
  }
});
