// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { noProject } from "@assemblejs/cli";

describe("what add says where there is no project", () => {
  it("names where it looked and what to do", () => {
    expect(noProject("../shop")).toBe(
      "there is no project at ../shop: run this in a project's directory, or name one with --cwd",
    );
  });
});
