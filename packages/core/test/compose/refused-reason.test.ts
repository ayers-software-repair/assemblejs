// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { FailureReason, RefusedReason } from "@assemblejs/core";

describe("the refusals a request accounts for once", () => {
  it("are the two the request shares one id for, each a failure reason", () => {
    const shared: RefusedReason[] = ["too-many", "aborted"];
    const reasons: FailureReason[] = shared;
    expect(reasons).toEqual(["too-many", "aborted"]);
  });
});
