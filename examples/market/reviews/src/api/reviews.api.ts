// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";
import { reviewsOf } from "../reviews/reviews.js";

// What people said of one product, as data, for whoever asks this server.
export default defineApi({
  path: "/api/reviews/:sku",
  handle: ({ params }) => reviewsOf(params["sku"]),
});
