// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Buffer } from "node:buffer";
import type { Page } from "@playwright/test";

/** Compare actual compositor PNGs without adding analysis elements to the product DOM. */
export async function compareLandingPaint(page: Page, reference: Buffer) {
  const image = await page.screenshot({ scale: "css" });
  const pixels = await page.evaluate(
    async ({ before, after }) => {
      const decode = (encoded: string) =>
        createImageBitmap(
          new Blob([Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))], {
            type: "image/png",
          }),
        );
      const first = await decode(before);
      try {
        const second = await decode(after);
        try {
          if (first.width !== second.width || first.height !== second.height)
            throw new Error("paint dimensions changed");
          const canvas = new OffscreenCanvas(first.width, first.height);
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("screenshot pixel analysis is unavailable");
          context.drawImage(first, 0, 0);
          const a = context.getImageData(0, 0, first.width, first.height).data;
          context.clearRect(0, 0, first.width, first.height);
          context.drawImage(second, 0, 0);
          const b = context.getImageData(0, 0, first.width, first.height).data;
          let differentPixels = 0;
          for (let index = 0; index < a.length; index += 4) {
            if (
              a[index] !== b[index] ||
              a[index + 1] !== b[index + 1] ||
              a[index + 2] !== b[index + 2]
            )
              differentPixels++;
          }
          return { differentPixels, paintWidth: first.width, paintHeight: first.height };
        } finally {
          second.close();
        }
      } finally {
        first.close();
      }
    },
    { before: reference.toString("base64"), after: image.toString("base64") },
  );
  return { image, ...pixels };
}
