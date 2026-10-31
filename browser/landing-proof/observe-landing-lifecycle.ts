// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Page } from "@playwright/test";

/** Observe native lifecycle and worker replies without requesting or altering a draw. */
export async function observeLandingLifecycle(page: Page) {
  await page.addInitScript(() => {
    const events: object[] = [];
    const record = (event: string) => {
      const canvas = document.querySelector<HTMLCanvasElement>("[data-landing-background]");
      const bounds = canvas?.getBoundingClientRect();
      const style = canvas && getComputedStyle(canvas);
      events.push({
        event,
        time: performance.now(),
        hidden: document.hidden,
        scrollY,
        width: canvas?.width,
        height: canvas?.height,
        bounds: bounds?.toJSON(),
        opacity: style?.opacity,
        display: style?.display,
        visibility: style?.visibility,
        transition: Boolean(document.activeViewTransition),
      });
      if (events.length > 64) events.shift();
      if (document.documentElement)
        document.documentElement.dataset.landingLifecycle = JSON.stringify(events);
    };
    for (const event of ["pageshow", "pagereveal", "pagehide", "resize", "visibilitychange"])
      addEventListener(event, () => record(event), true);
    const NativeWorker = window.Worker;
    if (typeof NativeWorker === "undefined") return;
    window.Worker = class extends NativeWorker {
      constructor(...args: ConstructorParameters<typeof NativeWorker>) {
        super(...args);
        if (new URL(String(args[0]), location.href).pathname !== "/kit/landing-worker.js") return;
        this.addEventListener("message", ({ data }: MessageEvent<unknown>) => {
          if (data !== null && typeof data === "object" && "type" in data)
            record(`worker:${String(data.type)}`);
        });
      }
    };
  });
}
