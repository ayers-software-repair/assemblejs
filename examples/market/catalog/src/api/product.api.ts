// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";
import { productBySku } from "../catalogue/products.js";

// One product by its sku, or null where there is none: an api answers data, and what is not
// there is data too.
export default defineApi({
  path: "/api/products/:sku",
  handle: ({ params }) => productBySku(params["sku"]) ?? null,
});
