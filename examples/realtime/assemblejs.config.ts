// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "@asmjs/core";
import { ADMITTED, OTHER } from "./src/servers/origins.js";

export default defineConfig({
  remotes: [
    // Its browser runtime joins the page's bus, and the relay passes on the visitor's language
    // to its api; the other server is neither.
    { origin: ADMITTED, events: true, forward: ["accept-language"] },
    { origin: OTHER },
  ],
});
