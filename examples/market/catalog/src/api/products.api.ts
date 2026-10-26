// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";
import { productsIn } from "../catalogue/products.js";

// The catalogue as data, for the shop's own server to ask: a search, a quote, an order.
export default defineApi({
  path: "/api/products",
  handle: ({ query }) => productsIn(query.get("category") ?? undefined, query.get("q")),
});
