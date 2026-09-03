// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { StartOptions } from "@assemblejs/core/client";

describe("what the runtime is started with", () => {
  it("needs the browser half of each renderer, keyed by what the envelope declares", () => {
    const options: StartOptions = {
      renderers: { html: { mount: () => ({ unmount: () => {} }) } },
    };
    expect(Object.keys(options.renderers)).toEqual(["html"]);
    expect(options.root).toBeUndefined();
  });
});
