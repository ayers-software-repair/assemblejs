// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";
import { search } from "../shop/catalogue.js";

// What the search box shows as a visitor types: asked of the catalogue, a few at most.
export default defineApi({
  path: "/api/search",
  handle: async ({ query }) => {
    const words = (query.get("q") ?? "").trim();
    if (words.length < 2) return [];
    return (await search(words)).slice(0, 5).map(({ sku, name }) => ({ sku, name }));
  },
});
