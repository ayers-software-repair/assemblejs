// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { EVENTS_META_NAME } from "@assemblejs/core";

describe("the name the remotes a page's bus admits are written under", () => {
  it("is the product's own, so no other meta element is read as one", () => {
    expect(EVENTS_META_NAME).toBe("assemblejs-events");
  });
});
