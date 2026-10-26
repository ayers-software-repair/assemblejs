// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@asmjs/core";

// What a visitor sent, handed to a view that writes it raw.
export default defineService({
  name: "board",
  schema: { properties: { note: { type: "string" } }, required: ["note"] },
  run: ({ query }) => ({ note: query.get("note") ?? "" }),
});
