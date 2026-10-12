// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

export default defineService({
  name: "promises",
  run: () => ({
    promises: [
      { title: "Roasted to order", words: "Tuesday's roast is in Wednesday's post." },
      { title: "Ground for your brewer", words: "Or left whole, which is how we would have it." },
      { title: "Thirty days to change your mind", words: "Kit comes back, no questions." },
    ],
  }),
});
