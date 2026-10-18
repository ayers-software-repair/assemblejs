// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";
import { CATEGORIES, price, productBySku } from "../../catalogue/products.js";

const GRINDS = ["Whole bean", "Filter", "Press", "Espresso"];

/** A product as its page shows it. */
export type Found = {
  found: true;
  sku: string;
  name: string;
  blurb: string;
  price: string;
  mark: string;
  tone: string;
  category: { slug: string; name: string };
  grinds: string[];
  grind: string;
};
/** What the page is given for a sku the catalogue does not hold. */
export type Missing = { found: false; sku: string };

// The page's route names the product (`/p/:sku`). One that is not in the catalogue is answered
// as data like any other: the view says so, since a service cannot answer "not found". The
// grind a visitor chose is in the page's query, which is where the shop's buy box reads it too:
// two teams' assemblies on one page share a bus only where the page's project says so, and
// they always share the address.
export default defineService({
  name: "product",
  run: ({ params, query }): Found | Missing => {
    const product = productBySku(params["sku"]);
    if (product === undefined) return { found: false, sku: params["sku"] ?? "" };
    const category = CATEGORIES.find((one) => one.slug === product.category);
    return {
      found: true,
      sku: product.sku,
      name: product.name,
      blurb: product.blurb,
      price: price(product.cents),
      mark: product.mark,
      tone: product.tone,
      category: { slug: product.category, name: category?.name ?? "" },
      // Beans are ground to order; nothing else has a choice to make.
      grinds: product.category === "beans" ? GRINDS : [],
      grind: GRINDS.find((one) => one === query.get("grind")) ?? "Whole bean",
    };
  },
});
