// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

export default defineService({
  name: "label",
  schema: { properties: { label: { type: "string" } }, required: ["label"] },
  run: () => ({ label: "Clicked" }),
});
