// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { search } from "../../shop/catalogue.js";
import { stock } from "../../shop/stock.js";

// Every level, with the name the catalogue gives the thing: asked of their server once per
// render, and shown by its code alone if they do not answer.
export default defineService({
  name: "board",
  run: async () => {
    const names = new Map((await search("")).map((product) => [product.sku, product.name]));
    return {
      levels: stock.all().map((level) => ({ ...level, name: names.get(level.sku) ?? level.sku })),
    };
  },
});
