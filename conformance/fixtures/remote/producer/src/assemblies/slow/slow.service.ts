// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Answers after a second and a half, longer than any page placing it waits.
export default defineService({
  name: "slow",
  schema: { properties: {} },
  run: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {};
  },
});
