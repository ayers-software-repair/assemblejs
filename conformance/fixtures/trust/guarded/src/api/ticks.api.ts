// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// One message on connect, then quiet: a stream is a route like any other to the access decision.
export default defineApi({
  path: "/api/ticks",
  stream: ({ send }) => {
    send("tick", { n: 1 });
  },
});
