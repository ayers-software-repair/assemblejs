// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";

// What the check keeps from the visitors' team by its path.
export default defineApi({
  path: "/api/staff",
  handle: () => ({ rota: ["lovelace"] }),
});
