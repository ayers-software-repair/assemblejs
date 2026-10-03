// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ScannedTag } from "@assemblejs/core";

describe("a start tag read from a remote's answer", () => {
  it("says where it sits, so it can be rewritten in place", () => {
    const tag: ScannedTag = { name: "p", start: 4, end: 7, attributes: [], selfClosing: false };
    expect(tag.end - tag.start).toBe("<p>".length);
  });
});
