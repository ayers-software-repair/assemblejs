// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

export default defineApi({
  path: "/api/closed",
  handle: () => ({ closed: true }),
});
