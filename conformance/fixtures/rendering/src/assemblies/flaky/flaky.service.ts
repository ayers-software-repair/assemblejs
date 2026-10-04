// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Answers its first call and fails its second, and so on, so a spec can fill a cache on one page
// and fail on another.
let calls = 0;

export default defineService({
  name: "flaky",
  schema: { properties: { call: { type: "number" } }, required: ["call"] },
  run: () => {
    calls += 1;
    if (calls % 2 === 0) throw new Error("flaky failed on an even call");
    return { call: calls };
  },
});
