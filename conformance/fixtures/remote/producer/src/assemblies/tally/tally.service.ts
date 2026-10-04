// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// How many times this process has rendered the tally, so a cached placement is told apart from
// one fetched again.
let renders = 0;

export default defineService({
  name: "tally",
  schema: { properties: { count: { type: "number" } }, required: ["count"] },
  run: () => ({ count: (renders += 1) }),
});
