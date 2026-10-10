// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// A stored value, as a record in a database might hold one: nothing a visitor sent. It names
// an assembly ten thousand times, and the view writes it raw.
export default defineService({
  name: "flooded",
  schema: { properties: { stored: { type: "string" } }, required: ["stored"] },
  run: () => ({ stored: '<assembly name="plain"/>'.repeat(10_000) }),
});
