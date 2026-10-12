// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// Guarded by the shop's own access check: the address, the board wherever it is shown, and the
// api that sets a level (assemblejs.config.ts).
export default definePage({
  route: "/staff/stock",
  stream: "/api/stock",
  place: {
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
