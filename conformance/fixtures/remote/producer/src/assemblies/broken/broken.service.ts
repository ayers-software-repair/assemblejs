// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Fails every time, so the producer answers its content endpoint with 500.
export default defineService({
  name: "broken",
  schema: { properties: {} },
  run: () => {
    throw new Error("the producer failed: secret detail");
  },
});
