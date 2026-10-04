// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { definePage } from "@assemblejs/core";

// Two assemblies the page does not wait for: the browser fetches each once the page has loaded.
export default definePage({
  place: { "react-counter": { defer: true }, "vue-counter": { defer: true } },
});
