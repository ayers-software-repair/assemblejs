// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { stock } from "../shop/stock.js";

// The page's one stream: each page that opens it is told every level as it stands, then every
// change, on its own bus. An assembly hears "stock:changed" and does not know it came by wire.
export default defineApi({
  path: "/api/stock",
  stream: ({ send, signal }) => {
    for (const level of stock.all()) send("stock:changed", level);
    stock.listen(send, signal);
  },
});
