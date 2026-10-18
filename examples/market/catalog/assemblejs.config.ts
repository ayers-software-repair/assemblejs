// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@assemblejs/core";

export default defineConfig({
  // Where `perf` weighs the two pages whose route has a parameter.
  addresses: { "/c/:category": "/c/beans", "/p/:sku": "/p/kb-guji-250" },
  // Every page shows its outline: the switch at the corner draws a box around each assembly that
  // says what it is, where it came from and when.
  outline: true,
});
