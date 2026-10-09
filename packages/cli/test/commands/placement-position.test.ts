// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PlacementPosition } from "@assemblejs/cli";

describe("where a placement goes", () => {
  it("is the start or end of the body, or beside a named assembly", () => {
    const positions: PlacementPosition[] = [
      { at: "start" },
      { at: "end" },
      { after: "a" },
      { before: "b" },
    ];
    expect(positions).toHaveLength(4);
  });
});
