// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { CompositionHeaders } from "@assemblejs/core";

describe("the composition state a request carries", () => {
  it("says it is the page itself by the absence of a page id", () => {
    const asPage: CompositionHeaders = { page: undefined, id: undefined, depth: 0, path: [] };
    expect(asPage.page).toBeUndefined();
  });
});
