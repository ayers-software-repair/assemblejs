// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Admission } from "@asmjs/core";

describe("what asking whether a visitor may be shown a placement answers", () => {
  it("is let in, or not, and carries an id only where the check itself broke", () => {
    const answers: Admission[] = [
      { admitted: true },
      { admitted: false },
      { admitted: false, correlationId: "c-1" },
    ];
    expect(answers.filter((answer) => answer.admitted)).toHaveLength(1);
  });
});
