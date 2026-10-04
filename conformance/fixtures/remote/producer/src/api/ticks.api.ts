// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// One message the moment a page connects, with a line break in its payload, then quiet.
export default defineApi({
  path: "/api/ticks",
  stream: ({ send }) => {
    send("tick", { n: 1, note: "two\nlines" });
  },
});
