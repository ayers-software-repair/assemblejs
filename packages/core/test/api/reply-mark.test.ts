// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { reply } from "@asmjs/core";

describe("the mark on a reply", () => {
  it("is one symbol-keyed member, which JSON leaves out", () => {
    const made = reply({ status: 204 });
    const marks = Object.getOwnPropertySymbols(made);
    expect(marks.map((mark) => mark.description)).toEqual(["assemblejs.reply"]);
    expect(JSON.parse(JSON.stringify(made))).toEqual({ status: 204, headers: {}, cookies: {} });
  });
});
