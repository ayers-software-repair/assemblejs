// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EventScope } from "@asmjs/core/client";

describe("who a message is for", () => {
  it("is everyone, one name, or one instance", () => {
    const scopes: EventScope[] = ["all", { name: "cart" }, { id: "a7f3" }];
    expect(scopes).toHaveLength(3);
  });
});
