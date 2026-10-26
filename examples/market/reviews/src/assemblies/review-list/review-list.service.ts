// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";
import { reviewsOf } from "../../reviews/reviews.js";

// What was said of the product the page's route names, newest first.
export default defineService({
  name: "reviews",
  run: ({ params }) => ({
    reviews: reviewsOf(params["sku"])
      .map(({ by, stars, said, on }) => ({ by, stars, said, on }))
      .sort((one, other) => other.on.localeCompare(one.on)),
  }),
});
