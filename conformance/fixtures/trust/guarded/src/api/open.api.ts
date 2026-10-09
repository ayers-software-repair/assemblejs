// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// Declared public, exactly, in assemblejs.config.ts.
export default defineApi({
  path: "/api/open",
  handle: () => ({ open: true }),
});
