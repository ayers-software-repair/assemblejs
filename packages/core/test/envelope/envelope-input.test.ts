// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EnvelopeInput } from "@assemblejs/core";

describe("what the envelope is built from", () => {
  it("treats the assembly's own markup as the one verbatim value", () => {
    const input: EnvelopeInput = {
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "html",
      markup: "<p>cart</p>",
      data: {},
    };
    expect(input.remote).toBeUndefined();
    expect(input.deferred).toBeUndefined();
    expect(input.failed).toBeUndefined();
  });
});
