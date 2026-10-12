// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";
import { CATALOG, REVIEWS, from } from "../../shop/origins.js";

// One page, three servers. The product is the catalogue team's and the page is nothing without
// it, so it is required: if their server does not answer, the page fails whole rather than
// selling something it cannot show. Reviews are the reviews team's and the page is fine without
// them: a short deadline, and a line that says so. The buy box is the shop's own, and hears the
// stock change over the page's stream.
export default definePage({
  route: "/p/:sku",
  stream: "/api/stock",
  place: {
    "category-list": { url: from(CATALOG, "category-list"), deadline: 800, fallback: "" },
    "product-detail": { url: from(CATALOG, "product-detail"), deadline: 1500, required: true },
    "roast-meter": { url: from(CATALOG, "roast-meter"), deadline: 800, fallback: "" },
    "product-facts": {
      url: from(CATALOG, "product-facts"),
      deadline: 800,
      cache: { ttl: 300_000 },
      fallback: "",
    },
    rating: { url: from(REVIEWS, "rating"), deadline: 400, fallback: "" },
    "review-list": {
      url: from(REVIEWS, "review-list"),
      deadline: 600,
      fallback:
        '<p class="notice">Reviews are unavailable right now. Everything else on this page is as it should be.</p>',
    },
    "recently-viewed": { defer: true },
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
