// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MountMode } from "./mount-mode.js";

/**
 * Runs a mount when its declared mode says to, and returns a function that cancels it.
 *
 * Every mode returns a cancel, including the ones that already ran, so a caller never has to
 * ask which kind it got. A scheduler whose cancel is sometimes absent is a scheduler whose
 * observers leak on the one path nobody tested.
 */
export function scheduleMount(element: Element, mode: MountMode, run: () => void): () => void {
  if (mode === "none") return () => {};
  if (mode === "load") {
    run();
    return () => {};
  }

  if (mode === "idle") {
    const idle = (globalThis as { requestIdleCallback?: (fn: () => void) => number })
      .requestIdleCallback;
    if (idle === undefined) {
      // Not every browser has it. A timeout of zero is the same promise: after this task.
      const timer = setTimeout(run, 0);
      return () => clearTimeout(timer);
    }
    const handle = idle(run);
    const cancel = (globalThis as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    return () => cancel?.(handle);
  }

  // visible. Without an observer the honest fallback is to mount, because never mounting turns
  // a progressive enhancement into a silently dead assembly.
  if (typeof IntersectionObserver === "undefined") {
    run();
    return () => {};
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.disconnect();
      run();
      return;
    }
  });
  observer.observe(element);
  return () => observer.disconnect();
}
