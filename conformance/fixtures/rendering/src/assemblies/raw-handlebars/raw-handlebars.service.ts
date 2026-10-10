// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";

// What a visitor sent, handed to the view as it came. The view writes it twice: escaped, as a
// view should, and raw, which makes it markup.
export default defineService({
  name: "raw-handlebars",
  schema: { properties: { note: { type: "string" } }, required: ["note"] },
  run: ({ query }) => ({ note: query.get("note") ?? "" }),
});
