// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";
import { contrast } from "../../scripts/check-site.mjs";

/** Measure the real API's inherited foreground roles against its product surfaces. */
export async function inspectApiPalette(page: Page) {
  const css = await readFile("site/api-theme.css", "utf8");
  const tokens = [...css.matchAll(/(--color-ts-[a-z-]+):/g)].map((match) => match[1]);
  expect(tokens.length).toBeGreaterThanOrEqual(20);
  const names = ["--color-icon-text", "--color-focus-outline", ...tokens];
  const palette = await page.evaluate((roles) => {
    const style = getComputedStyle(document.body);
    return {
      theme: document.documentElement.dataset.theme,
      savedTheme: localStorage.getItem("tsd-theme"),
      surfaces: ["--surface", "--surface-panel"].map((name) => style.getPropertyValue(name).trim()),
      values: Object.fromEntries(roles.map((name) => [name, style.getPropertyValue(name).trim()])),
    };
  }, names);
  const ratios = Object.entries(palette.values).map(([name, color]) => {
    expect(color).toMatch(/^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i);
    const minimum = Math.min(...palette.surfaces.map((background) => contrast(color, background)));
    expect(minimum, name).toBeGreaterThanOrEqual(tokens.includes(name) ? 4.5 : 3);
    return { name, color, minimum };
  });
  return { ...palette, ratios };
}
