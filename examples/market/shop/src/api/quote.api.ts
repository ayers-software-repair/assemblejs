// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";
import { asked, quote } from "../shop/quote.js";

// Prices a basket: the browser sends what it holds, the server answers what that costs today.
export default defineApi({
  path: "/api/quote",
  method: "POST",
  handle: async ({ body }) => quote(asked(body)),
});
