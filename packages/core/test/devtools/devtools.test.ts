// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Devtools } from "@assemblejs/core";

describe("what a devtools package hands the server", () => {
  it("is its routes, nothing else", () => {
    const devtools: Devtools = { routes: [] };
    expect(Object.keys(devtools)).toEqual(["routes"]);
  });
});
