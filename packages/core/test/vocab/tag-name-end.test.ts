// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TAG_NAME_END } from "@asmjs/core";

describe("where the name of a tag ends", () => {
  it("is at white space, a slash or the tag's end, and at nothing else", () => {
    const ends = new RegExp(`^${TAG_NAME_END}$`);
    for (const character of ["\t", "\n", "\f", "\r", " ", "/", ">"]) {
      expect(ends.test(character), JSON.stringify(character)).toBe(true);
    }
    for (const character of ["-", "_", ":", ".", "a", "1", "<", "=", '"']) {
      expect(ends.test(character), character).toBe(false);
    }
  });

  it("can be looked ahead for after a name, so the name is matched whole", () => {
    const title = new RegExp(`<title(?=${TAG_NAME_END})`, "i");
    expect(title.test("<title>")).toBe(true);
    expect(title.test("<TITLE lang=en>")).toBe(true);
    expect(title.test("<title-bar>")).toBe(false);
  });
});
