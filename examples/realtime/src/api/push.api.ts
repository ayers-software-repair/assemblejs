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
    for (const send of priceFeed) send("price", body ?? null);
    return { reached: priceFeed.size } satisfies JsonValue;
  },
});
