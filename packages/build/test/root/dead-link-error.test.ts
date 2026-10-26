// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DeadLinkError, OutsideRootError } from "@asmjs/build";

describe("the refusal of a link that leads nowhere", () => {
  it("says what was asked for and that it leads nowhere", () => {
    const error = new DeadLinkError("src/assemblies/cart/gone.css", "/project");
    expect(error.message).toBe('"src/assemblies/cart/gone.css" is a link that leads nowhere');
    expect(error.name).toBe("DeadLinkError");
    expect([error.attempted, error.root]).toEqual(["src/assemblies/cart/gone.css", "/project"]);
  });

  // Every reader passes over what the root guard refuses, so one that leads nowhere is passed
  // over as one that leads out is.
  it("is a refusal of the root guard's, to whoever catches those", () => {
    expect(new DeadLinkError("x", "/project")).toBeInstanceOf(OutsideRootError);
  });
});
