// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";
import { ADMITTED, OTHER, from } from "../../servers/origins.js";

// The sender is this server's own; the hearers and the caller are other servers' assemblies.
export default definePage({
  place: {
    "admitted-hearer": { url: from(ADMITTED, "hearer") },
    "other-hearer": { url: from(OTHER, "hearer") },
    "admitted-caller": { url: from(ADMITTED, "caller") },
  },
});
