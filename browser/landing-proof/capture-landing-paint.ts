// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Page } from "@playwright/test";

/** Measure the compositor's actual PNG; the analysis canvas never enters the product DOM. */
export async function captureLandingPaint(page: Page) {
  const image = await page.screenshot({ fullPage: true, scale: "css" });
  const pixels = await page.evaluate(async (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const analysis = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = analysis.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("screenshot pixel analysis is unavailable");
      context.drawImage(bitmap, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      let edges = 0;
      let maxDelta = 0;
      // These gutters exclude foreground text/cards; a smooth CSS fallback has no weave edges.
      for (const x of [4, 8, 12, width - 13, width - 9, width - 5]) {
        for (let y = 110; y < Math.min(height, 850); y++) {
          let delta = 0;
          for (let channel = 0; channel < 3; channel++)
            delta = Math.max(
              delta,
              Math.abs(
                data[(y * width + x) * 4 + channel] - data[((y - 1) * width + x) * 4 + channel],
              ),
            );
          maxDelta = Math.max(maxDelta, delta);
          if (delta >= 3) edges++;
        }
      }
      return { edges, maxDelta, paintWidth: width, paintHeight: height };
    } finally {
      bitmap.close();
    }
  }, image.toString("base64"));
  return { image, ...pixels };
}
