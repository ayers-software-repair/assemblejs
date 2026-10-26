// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@asmjs/core";

// Answers with a word, the host that was asked and the one header the relay may pass on, so a
// caller can tell which server answered and what that server was told.
export default defineApi({
  path: "/api/answer",
  handle: ({ headers }) => ({
    word: "relayed",
    host: headers["host"] ?? "",
    lang: headers["accept-language"] ?? null,
  }),
});
