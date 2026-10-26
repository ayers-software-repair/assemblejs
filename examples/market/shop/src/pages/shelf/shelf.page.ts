// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@asmjs/core";
import { CATALOG, from } from "../../shop/origins.js";

const unanswered =
  '<p class="notice notice--strong">The shelves are not answering just now. Try again in a moment.</p>';

// A shelf is the catalogue team's from top to bottom: the page is the shop's, and every part
// of it but the header and footer comes from their server. The two that talk to each other,
// the facets and the grid, are both theirs, so they share that server's bus.
export default definePage({
  route: "/c/:category",
  place: {
    "category-list": { url: from(CATALOG, "category-list"), deadline: 800, fallback: "" },
    facets: { url: from(CATALOG, "facets"), deadline: 800, fallback: "" },
    "product-grid": { url: from(CATALOG, "product-grid"), deadline: 1200, fallback: unanswered },
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
