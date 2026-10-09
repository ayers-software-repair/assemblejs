// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// Two assemblies in their own shadow roots, fetched once the page has loaded.
export default definePage({
  place: { "react-box": { defer: true }, "svelte-box": { defer: true } },
});
