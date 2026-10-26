// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { headersOf } from "@asmjs/core";

describe("reading a request's headers", () => {
  it("gives each as text, and a header sent twice joined with a comma", () => {
    expect(headersOf({ host: "a.test", "x-tag": ["one", "two"], "x-none": undefined })).toEqual({
      host: "a.test",
      "x-tag": "one, two",
    });
    expect(headersOf({})["constructor"]).toBeUndefined();
  });
});
