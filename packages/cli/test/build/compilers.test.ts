// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Compilers } from "@assemblejs/cli";

describe("the compilers a build carries", () => {
  it("holds only the ones the project's views need", () => {
    const none: Compilers = {};
    expect(Object.keys(none)).toEqual([]);
  });
});
