// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";
import { FULFILMENT, from } from "../../shop/origins.js";

// The order is the shop's; where the parcel is, is the fulfilment team's, asked of their server
// with the same id from the address.
export default definePage({
  route: "/orders/:id",
  place: {
    "shipment-progress": {
      url: from(FULFILMENT, "shipment-progress"),
      deadline: 600,
      fallback:
        '<p class="notice">We cannot see where the parcel is right now. The order itself is safe.</p>',
    },
    // The footer is the same for every visitor, so one render serves five minutes of pages.
    "site-footer": { cache: { ttl: 300_000 } },
  },
});
