// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { priceFeed } from "./price-feed.js";

// Each page's one connection joins the feed, and leaves it when the page goes away.
export default defineApi({
  path: "/api/prices",
  stream: ({ send, signal }) => {
    priceFeed.add(send);
    signal.addEventListener("abort", () => priceFeed.delete(send));
  },
});
