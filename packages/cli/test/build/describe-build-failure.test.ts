// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { describeBuildFailure } from "@assemblejs/cli";

describe("reporting a failed bundle", () => {
  it("names the file and line of each of the bundler's errors", () => {
    const failure = { errors: [{ text: "Unexpected }", location: { file: "src/a.ts", line: 3 } }] };
    expect(describeBuildFailure(failure)).toEqual(["src/a.ts:3 Unexpected }"]);
  });

  it("falls back to the message of anything else that was thrown", () => {
    expect(describeBuildFailure(new Error("disk full"))).toEqual(["disk full"]);
    expect(describeBuildFailure({ errors: [{ text: "no location" }] })).toEqual(["no location"]);
  });
});
