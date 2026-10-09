// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { createBus, openPageStream } from "@assemblejs/core/client";
import { fakeStream } from "../fixtures/fake-stream.js";

beforeEach(() => {
  document.head.innerHTML = '<meta name="assemblejs-stream" content="/live">';
});

describe("opening the page's one stream", () => {
  it("opens the one the page names, from the page's own runtime", () => {
    for (const options of [{ renderers: {} }, { renderers: {}, origin: location.origin }]) {
      const stream = fakeStream();
      const close = openPageStream(options, createBus(), stream.open);
      expect(stream.opened).toEqual(["/live"]);
      close?.();
      expect(stream.closed()).toBe(1);
    }
  });

  it("opens none from a remote's runtime, so the page holds one connection", () => {
    const stream = fakeStream();
    const close = openPageStream(
      { renderers: {}, origin: "https://remote.example" },
      createBus(),
      stream.open,
    );
    expect(close).toBeUndefined();
    expect(stream.opened).toEqual([]);
  });

  it("opens the one it was started with, and none when there is none", () => {
    const stream = fakeStream();
    openPageStream({ renderers: {}, stream: "/given" }, createBus(), stream.open);
    expect(stream.opened).toEqual(["/given"]);
    document.head.innerHTML = "";
    expect(openPageStream({ renderers: {} }, createBus(), stream.open)).toBeUndefined();
  });
});
