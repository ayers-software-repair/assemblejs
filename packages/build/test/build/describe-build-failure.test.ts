// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { describeBuildFailure } from "@asmjs/build";

describe("reporting a failed bundle", () => {
  it("names the file and line of each of the bundler's errors", () => {
    const failure = { errors: [{ text: "Unexpected }", location: { file: "src/a.ts", line: 3 } }] };
    expect(describeBuildFailure(failure)).toEqual(["src/a.ts:3 Unexpected }"]);
  });

  // Lines count from one, so a location with none, or with nought, is the file's alone.
  it("names the file alone for an error of no line of it", () => {
    const of = (location: object) =>
      describeBuildFailure({ errors: [{ text: "refused", location }] });
    expect(of({ file: "src/a.vue", line: 0 })).toEqual(["src/a.vue refused"]);
    expect(of({ file: "src/a.vue" })).toEqual(["src/a.vue refused"]);
  });

  it("falls back to the message of anything else that was thrown", () => {
    expect(describeBuildFailure(new Error("disk full"))).toEqual(["disk full"]);
    expect(describeBuildFailure({ errors: [{ text: "no location" }] })).toEqual(["no location"]);
  });
});
