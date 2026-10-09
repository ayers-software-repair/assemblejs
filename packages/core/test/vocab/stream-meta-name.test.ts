// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { STREAM_META_NAME } from "@assemblejs/core";

describe("the name a page's stream is written under", () => {
  it("is the product's own, so no other meta element is read as one", () => {
    expect(STREAM_META_NAME).toBe("assemblejs-stream");
  });
});
