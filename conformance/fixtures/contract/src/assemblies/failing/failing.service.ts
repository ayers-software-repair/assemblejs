// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// A service that throws, as an upstream that is down does.
export default defineService({
  name: "failing",
  schema: { properties: {}, required: [] },
  run: () => {
    throw new Error("upstream is down: postgres://user:secret@db");
  },
});
