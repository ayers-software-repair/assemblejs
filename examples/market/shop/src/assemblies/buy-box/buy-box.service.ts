// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { NotFound, defineService } from "@asmjs/core";
import { listed } from "../../shop/catalogue.js";
import type { Offer } from "../../shop/offer.js";
import { stock } from "../../shop/stock.js";

// What it costs and how many are left, for the product the page's route names. The price is
// the catalogue team's, asked of their server; the stock is this shop's own. The grind is the
// visitor's choice, made in the catalogue team's assembly on the same page and read here from
// the same place that assembly reads it: the page's query. A sku the catalogue says it does
// not hold is not a product page at all, so the shop answers its not-found page. A catalogue
// that cannot be asked is not the same thing, and is never answered as one.
export default defineService<Offer>({
  name: "offer",
  run: async ({ params, query }) => {
    const sku = params["sku"] ?? "";
    const product = await listed(sku);
    if (product === null) throw new NotFound(`the catalogue holds no "${sku}"`);
    if (product === undefined) return { found: false, sku, name: "", cents: 0, left: 0, grind: "" };
    return {
      found: true,
      sku,
      name: product.name,
      cents: product.cents,
      left: stock.of(sku),
      grind: product.category === "beans" ? (query.get("grind") ?? "Whole bean").slice(0, 40) : "",
    };
  },
});
