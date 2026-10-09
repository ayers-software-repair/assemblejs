// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { priceFeed } from "./price-feed.js";

// Each page's one connection starts from the latest price, joins the feed, and leaves it when the
// page goes away.
export default defineApi({
  path: "/api/prices",
  stream: ({ send, signal }) => {
    send("price", priceFeed.latest);
    priceFeed.listening.add(send);
    signal.addEventListener("abort", () => priceFeed.listening.delete(send));
  },
});
