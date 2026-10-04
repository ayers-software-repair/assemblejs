// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// An answer past the two mebibytes a composing server reads.
export default defineService({
  name: "huge",
  schema: { properties: { blob: { type: "string" } }, required: ["blob"] },
  run: () => ({ blob: "x".repeat(3 * 1024 * 1024) }),
});
