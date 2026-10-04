// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// Data with markup in it, which the view must write escaped.
export default defineService({
  name: "vue-label",
  schema: { properties: { label: { type: "string" } }, required: ["label"] },
  run: () => ({ label: "<b>vue</b>" }),
});
