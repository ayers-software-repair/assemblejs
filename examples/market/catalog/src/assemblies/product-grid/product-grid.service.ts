// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { CATEGORIES, band, price, productsIn } from "../../catalogue/products.js";

// The page's route says which shelf (`/c/:category`), and its query narrows it to the words a
// visitor searched for. The query reaches this server only because the shop declares it
// trusted with it.
export default defineService({
  name: "shelf",
  run: ({ params, query }) => {
    const category = CATEGORIES.find((one) => one.slug === params["category"]);
    const words = query.get("q");
    return {
      title: category?.name ?? "Everything",
      blurb: category?.blurb ?? "Beans, brewers and grinders, all in one place.",
      words: words ?? "",
      products: productsIn(category?.slug, words).map((product) => ({
        sku: product.sku,
        name: product.name,
        blurb: product.blurb,
        price: price(product.cents),
        cents: product.cents,
        band: band(product.cents),
        roast: product.roast ?? "",
        mark: product.mark,
        tone: product.tone,
      })),
    };
  },
});
