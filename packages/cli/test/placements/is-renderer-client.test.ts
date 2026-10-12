// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isRendererClient } from "@assemblejs/cli";

describe("whether an import names a renderer's browser entry", () => {
  it("does for a renderer's client entry, in any scope", () => {
    expect(isRendererClient("@assemblejs/renderer-react/client")).toBe(true);
    expect(isRendererClient("@acme/renderer-lit/client")).toBe(true);
    expect(isRendererClient("renderer-vue/client")).toBe(true);
  });

  it("does not for the server half, another package or a file of the project's", () => {
    expect(isRendererClient("@assemblejs/renderer-react")).toBe(false);
    expect(isRendererClient("@assemblejs/core/client")).toBe(false);
    expect(isRendererClient("./renderer-react/client.js")).toBe(false);
    expect(isRendererClient("my-renderer-react/client")).toBe(false);
  });
});
