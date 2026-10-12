// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { stock } from "../shop/stock.js";

// Staff set a level. The address is guarded by the project's own access check
// (assemblejs.config.ts), so only a signed-in member of staff reaches this.
export default defineApi({
  path: "/api/restock",
  method: "POST",
  handle: ({ body }) => {
    const { sku, left } = (typeof body === "object" && body !== null ? body : {}) as {
      sku?: unknown;
      left?: unknown;
    };
    if (typeof sku !== "string" || typeof left !== "number" || !Number.isFinite(left))
      return { ok: false };
    stock.set(sku, left);
    return { ok: true, sku, left: stock.of(sku) };
  },
});
