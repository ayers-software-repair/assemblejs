// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_SOURCE, DEV_RELOAD_STREAM } from "@assemblejs/core";

/** Runs the script against a stand-in event source and location, answering how to drive it. */
const run = () => {
  const opened: string[] = [];
  let reloads = 0;
  let handler: ((event: { data: string }) => void) | undefined;
  class Source {
    constructor(url: string) {
      opened.push(url);
    }
    set onmessage(next: (event: { data: string }) => void) {
      handler = next;
    }
  }
  const location = { reload: () => (reloads += 1) };
  new Function("EventSource", "location", DEV_RELOAD_SOURCE)(Source, location);
  const boot = (id: string) => handler?.({ data: JSON.stringify({ topic: "boot", payload: id }) });
  return { opened, boot, reloads: () => reloads };
};

describe("the script that reloads a page in development", () => {
  it("opens the reload stream", () => {
    expect(run().opened).toEqual([DEV_RELOAD_STREAM]);
  });

  it("reloads when it hears from a server that booted since, and only then", () => {
    const page = run();
    page.boot("first");
    page.boot("first");
    expect(page.reloads()).toBe(0);
    page.boot("second");
    expect(page.reloads()).toBe(1);
  });
});
