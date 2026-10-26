// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { ratingOf } from "../../reviews/reviews.js";

// The rating of the product the page's route names.
export default defineService({
  name: "rating",
  run: ({ params }) => ratingOf(params["sku"]),
});
