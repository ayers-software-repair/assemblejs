// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readMountMode } from "@assemblejs/core/client";

const envelope = (declared?: string): Element => {
  const element = document.createElement("assembly-root");
  if (declared !== undefined) element.setAttribute("data-mount", declared);
  return element;
};

describe("reading the declared mount mode", () => {
  it("defaults to mounting on load", () => {
    expect(readMountMode(envelope())).toBe("load");
    expect(readMountMode(envelope(""))).toBe("load");
  });

  it("reads each declared mode", () => {
    for (const mode of ["load", "idle", "visible", "none"]) {
      expect(readMountMode(envelope(mode))).toBe(mode);
    }
  });

  // A typo must not silently start executing code on a page whose author was trying to say
  // when that code should run. The safe reading of "I meant to control this" is "not yet".
  it("treats a value it does not recognise as none, not as load", () => {
    expect(readMountMode(envelope("client:visible"))).toBe("none");
    expect(readMountMode(envelope("Load"))).toBe("none");
    expect(readMountMode(envelope("laod"))).toBe("none");
  });
});
