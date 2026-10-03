// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import type { JsonValue } from "@assemblejs/core";
import { priceFeed } from "./price-feed.js";

// Sends a price to every listening page, answering how many it reached.
export default defineApi({
  path: "/api/push",
  method: "POST",
  handle: ({ body }) => {
    priceFeed.latest = body ?? null;
    for (const send of priceFeed.listening) send("price", priceFeed.latest);
    return { reached: priceFeed.listening.size } satisfies JsonValue;
  },
});
