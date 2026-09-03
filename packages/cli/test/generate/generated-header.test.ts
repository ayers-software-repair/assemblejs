// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { GENERATED_HEADER } from "@assemblejs/cli";

describe("the generated module's banner", () => {
  it("says it is generated, and says not to commit it", () => {
    // A generated file that does not say so is a file someone edits once and loses.
    expect(GENERATED_HEADER).toContain("GENERATED");
    expect(GENERATED_HEADER).toContain("Do not edit");
    expect(GENERATED_HEADER).toContain("do not commit");
  });

  it("carries the copyright header the repository requires everywhere", () => {
    expect(GENERATED_HEADER).toContain("Copyright Ayers Electronics Inc.");
    expect(GENERATED_HEADER).toContain("SPDX-License-Identifier: Apache-2.0");
  });
});
