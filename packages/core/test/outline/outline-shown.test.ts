// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { outlineShown } from "@assemblejs/core/outline";

beforeEach(() => localStorage.clear());

describe("whether a visitor has the outline drawn", () => {
  it("is off until they turn it on, and is kept from page to page once they have", () => {
    expect(outlineShown(document)).toBe(false);
    expect(outlineShown(document, true)).toBe(true);
    expect(outlineShown(document)).toBe(true);
    expect(outlineShown(document, false)).toBe(false);
    expect(outlineShown(document)).toBe(false);
  });

  it("lasts as long as the page where storage is refused, and never throws", () => {
    const refused = {
      defaultView: {
        get localStorage(): Storage {
          throw new Error("storage is refused");
        },
      },
    } as unknown as Document;
    expect(outlineShown(refused)).toBe(false);
    expect(outlineShown(refused, true)).toBe(true);
  });
});
