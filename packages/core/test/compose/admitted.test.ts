// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { admitted } from "@asmjs/core";
import type { Admit } from "@asmjs/core";

const placement = { name: "cart", view: "wide", plan: undefined };

describe("whether the visitor a placement's request belongs to may be shown it", () => {
  it("lets everyone in where nothing is there to ask", async () => {
    expect(await admitted({ ...placement, admit: undefined })).toEqual({ admitted: true });
  });

  it("asks by the placement's name and view, and answers what it was told", async () => {
    const asked: string[] = [];
    const admit: Admit = (name, view) => {
      asked.push(`${name}/${view}`);
      return { admitted: false };
    };
    expect(await admitted({ ...placement, admit })).toEqual({ admitted: false });
    expect(asked).toEqual(["cart/wide"]);
    const checked: Admit = async () => ({ admitted: false, correlationId: "c-4" });
    expect(await admitted({ ...placement, admit: checked })).toEqual({
      admitted: false,
      correlationId: "c-4",
    });
  });

  it("does not ask of an assembly the plan sends to another server, which decides for itself", async () => {
    let asked = 0;
    const admit: Admit = () => ({ admitted: (asked += 1) < 0 });
    const plan = { name: "cart", view: "wide", deadline: 3000, url: "https://other.example/x/" };
    expect(await admitted({ ...placement, plan, admit })).toEqual({ admitted: true });
    expect(asked).toBe(0);
  });

  it("refuses where what it asks throws: a broken gate is a closed one", async () => {
    const admit: Admit = () => {
      throw new Error("no answer");
    };
    expect(await admitted({ ...placement, admit })).toEqual({ admitted: false });
  });
});
