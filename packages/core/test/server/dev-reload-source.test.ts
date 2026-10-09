// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEV_RELOAD_SOURCE, DEV_RELOAD_SCRIPT, DEV_RELOAD_STREAM } from "@assemblejs/core";

/**
 * Runs the script as a page that was rendered by the server with `boot` would, against a stand-in
 * event source and location, answering how to drive it.
 */
const run = (boot: string) => {
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
  const url = JSON.stringify(`http://localhost${DEV_RELOAD_SCRIPT}?boot=${boot}`);
  new Function("EventSource", "location", DEV_RELOAD_SOURCE.replace("import.meta.url", url))(
    Source,
    location,
  );
  const hear = (id: string) => handler?.({ data: JSON.stringify({ topic: "boot", payload: id }) });
  return { opened, hear, reloads: () => reloads };
};

describe("the script that reloads a page in development", () => {
  it("opens the reload stream, and reads the boot the page was rendered with from its own url", () => {
    expect(run("a").opened).toEqual([DEV_RELOAD_STREAM]);
    expect(DEV_RELOAD_SOURCE).toContain("new URL(import.meta.url)");
  });

  it("stays while the server that rendered the page answers", () => {
    const page = run("first");
    page.hear("first");
    page.hear("first");
    expect(page.reloads()).toBe(0);
  });

  it("reloads once it hears another server, even on its first connection", () => {
    const page = run("first");
    page.hear("second");
    expect(page.reloads()).toBe(1);
  });
});
