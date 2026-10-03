// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ScannedAttribute } from "@assemblejs/core";

describe("an attribute of a scanned start tag", () => {
  it("keeps its source exactly as sent, quoting included", () => {
    const attribute: ScannedAttribute = { name: "data-x", source: "data-x='a'" };
    expect(attribute.source).toContain("'a'");
  });
});
