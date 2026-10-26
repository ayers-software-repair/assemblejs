// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { scheduleMount } from "@asmjs/core/client";

const element = () => document.createElement("assembly-root");

describe("scheduling a mount", () => {
  it("runs immediately on load", () => {
    const run = vi.fn();
    scheduleMount(element(), "load", run);
    expect(run).toHaveBeenCalledOnce();
  });

  it("never runs for none", () => {
    const run = vi.fn();
    scheduleMount(element(), "none", run);
    expect(run).not.toHaveBeenCalled();
  });

  it("runs after the current task for idle", async () => {
    const run = vi.fn();
    scheduleMount(element(), "idle", run);
    expect(run).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(run).toHaveBeenCalledOnce();
  });

  it("does not run for idle once cancelled", async () => {
    const run = vi.fn();
    scheduleMount(element(), "idle", run)();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(run).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "ignores queued visibility records after cancellation: %s",
    (cancelled) => {
      let deliver = (_visible: boolean): void => undefined;
      const disconnect = vi.fn();
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(callback: IntersectionObserverCallback) {
            deliver = (visible) =>
              callback(
                [{ isIntersecting: visible } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              );
          }
          observe = vi.fn();
          disconnect = disconnect;
        },
      );
      try {
        const run = vi.fn();
        const cancel = scheduleMount(element(), "visible", run);
        deliver(false);
        expect(run).not.toHaveBeenCalled();
        if (cancelled) cancel();
        deliver(true);
        deliver(true);
        expect(run).toHaveBeenCalledTimes(cancelled ? 0 : 1);
        expect(disconnect).toHaveBeenCalledOnce();
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );

  // Every mode returns a cancel, including the ones that already ran, so a caller never has to
  // ask which kind it got.
  it("always returns a cancel that is safe to call", () => {
    for (const mode of ["load", "idle", "visible", "none"] as const) {
      const cancel = scheduleMount(element(), mode, () => {});
      expect(() => {
        cancel();
        cancel();
      }).not.toThrow();
    }
  });

  it("mounts rather than never mounting when the browser has no observer", () => {
    const had = globalThis.IntersectionObserver;
    // @ts-expect-error removing it is the condition under test
    delete globalThis.IntersectionObserver;
    try {
      const run = vi.fn();
      scheduleMount(element(), "visible", run);
      // Never mounting would turn a progressive enhancement into a silently dead assembly.
      expect(run).toHaveBeenCalledOnce();
    } finally {
      globalThis.IntersectionObserver = had;
    }
  });
});
