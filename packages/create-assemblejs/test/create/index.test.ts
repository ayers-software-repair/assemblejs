// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createProject } from "@asmjs/create";
import { expect, test } from "vitest";
import { createProject as forwarded } from "create-assemblejs";

test("forwards the scoped starter without an alternate scaffold", () => {
  expect(forwarded).toBe(createProject);
});
