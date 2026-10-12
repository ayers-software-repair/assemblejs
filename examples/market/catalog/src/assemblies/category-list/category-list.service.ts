// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";
import { CATEGORIES, PRODUCTS } from "../../catalogue/products.js";

// The shelves, each with how many things stand on it, and which one the page is on.
export default defineService({
  name: "shelves",
  run: ({ params }) => ({
    shelves: [{ slug: "all", name: "Everything" }, ...CATEGORIES].map((category) => ({
      slug: category.slug,
      name: category.name,
      count: PRODUCTS.filter(
        (product) => category.slug === "all" || product.category === category.slug,
      ).length,
      here: (params["category"] ?? "") === category.slug,
    })),
  }),
});
