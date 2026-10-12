// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OUTLINE_ROUTE, OUTLINE_SOURCE } from "@assemblejs/core";

describe("the script a page links to draw its outline", () => {
  it("imports the module this server serves, and starts it", () => {
    expect(OUTLINE_SOURCE).toBe(`import { outline } from "${OUTLINE_ROUTE.module}";\noutline();\n`);
  });
});
