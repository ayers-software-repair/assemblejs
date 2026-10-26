// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { API_PATH } from "@asmjs/core";

describe("which paths are an api's", () => {
  it("takes /api, what is under it and a query on it", () => {
    for (const path of ["/api", "/api/stock", "/api/stock?sku=1", "/api?x=1"]) {
      expect(API_PATH.test(path), path).toBe(true);
    }
  });

  it("refuses everything else, a lookalike prefix included", () => {
    for (const path of ["api/stock", "/apis/x", "/apix", "/assembly/cart/", "/", "", "//api/x"]) {
      expect(API_PATH.test(path), path).toBe(false);
    }
  });
});
