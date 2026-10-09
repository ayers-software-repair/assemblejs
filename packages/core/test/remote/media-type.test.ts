// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { mediaType } from "@assemblejs/core";

describe("the media type a content-type header names", () => {
  it("drops the parameters and the case, and is nothing for no header", () => {
    expect(mediaType("Text/HTML; charset=utf-8")).toBe("text/html");
    expect(mediaType("text/htmlx")).toBe("text/htmlx");
    expect(mediaType(null)).toBe("");
  });
});
