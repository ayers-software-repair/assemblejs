// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@asmjs/core";
import { CATALOG, from } from "../../shop/origins.js";

export default definePage({
  place: {
    // The shelves are the catalogue team's, asked of their server and kept for a minute.
    "category-list": {
      url: from(CATALOG, "category-list"),
      deadline: 800,
      cache: { ttl: 60_000 },
      fallback: '<p class="notice">The shelves are not answering just now.</p>',
    },
    // Only the browser knows what it was shown, so this one is filled after the page loads.
    "recently-viewed": { defer: true },
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
