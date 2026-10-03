// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RuleId } from "@assemblejs/cli";

describe("a rule a problem names", () => {
  it("is one of the listed ids, which the compiler holds it to", () => {
    const id: RuleId = "directory-is-an-assembly";
    // @ts-expect-error an id that is not listed does not compile
    const unknown: RuleId = "a-rule-nobody-wrote";
    expect([id, unknown]).toHaveLength(2);
  });
});
