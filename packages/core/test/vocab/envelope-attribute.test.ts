// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ENVELOPE_ATTRIBUTE, ENVELOPE_ELEMENT, renderEnvelope } from "@assemblejs/core";

const opening = (html: string): readonly string[] => {
  const tag = new RegExp(`^<${ENVELOPE_ELEMENT}((?:\\s[^>]*)?)>`).exec(html)?.[1] ?? "";
  return [...tag.matchAll(/\s([a-z-]+)=/g)].map((match) => match[1] ?? "");
};

const BASE = {
  id: "a7f3",
  name: "cart",
  view: "default",
  renderer: "svelte",
  markup: "",
  data: {},
};

describe("the envelope's attributes", () => {
  it("are nine, each a data attribute, each named once", () => {
    const names = Object.values(ENVELOPE_ATTRIBUTE);
    expect(names).toHaveLength(9);
    expect(new Set(names).size).toBe(9);
    expect(names.every((name) => /^data-[a-z]+$/.test(name))).toBe(true);
  });

  it("are four on every envelope, in the order the design gives them", () => {
    expect(opening(renderEnvelope(BASE))).toEqual([
      ENVELOPE_ATTRIBUTE.name,
      ENVELOPE_ATTRIBUTE.id,
      ENVELOPE_ATTRIBUTE.view,
      ENVELOPE_ATTRIBUTE.renderer,
    ]);
  });

  it("are every attribute an envelope is ever written with, and no envelope has another", () => {
    const written = new Set([
      ...opening(
        renderEnvelope({
          ...BASE,
          remote: "https://shop.example",
          deferred: true,
          params: { id: "42" },
          mount: "visible",
        }),
      ),
      ...opening(renderEnvelope({ ...BASE, failed: "c0ffee" })),
    ]);
    expect([...written].sort()).toEqual(Object.values(ENVELOPE_ATTRIBUTE).sort());
  });
});
