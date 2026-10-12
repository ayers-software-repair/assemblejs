// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { BYTE_ORDER_MARK } from "@assemblejs/cli";

describe("the byte order mark", () => {
  it("is the one character U+FEFF, which JSON does not read past", () => {
    expect(BYTE_ORDER_MARK).toHaveLength(1);
    expect(BYTE_ORDER_MARK.codePointAt(0)).toBe(0xfeff);
    expect(() => JSON.parse(`${BYTE_ORDER_MARK}{}`) as unknown).toThrow();
    expect(JSON.parse(`${BYTE_ORDER_MARK}{}`.slice(BYTE_ORDER_MARK.length))).toEqual({});
  });
});
