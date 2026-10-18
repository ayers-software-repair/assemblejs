// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

export default defineConfig({
  // Where `perf` weighs the page whose route has a parameter. No parcel is in the depot until
  // an order is placed, so it is weighed as the page shows an order it has no parcel for.
  addresses: { "/orders/:id": "/orders/00000000-0000-4000-8000-000000000000" },
  // Every page shows its outline: the switch at the corner draws a box around each assembly that
  // says what it is, where it came from and when.
  outline: true,
});
