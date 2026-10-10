// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { SEGMENT } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD } from "@assemblejs/cli";

describe("the mark on what a file that cannot be read would have said", () => {
  it("is one word, and never the mark of a value that is computed", () => {
    expect(UNREAD).toBe("(unread)");
    expect(UNREAD).not.toBe(COMPUTED);
  });

  it("is nothing an author could have written where it stands", () => {
    expect(UNREAD.startsWith("/")).toBe(false);
    expect(SEGMENT.test(UNREAD)).toBe(false);
    expect(URL.canParse(UNREAD)).toBe(false);
  });
});
