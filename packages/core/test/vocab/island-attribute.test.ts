// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ENVELOPE_ATTRIBUTE, ISLAND_ATTRIBUTE, renderEnvelope } from "@asmjs/core";

describe("the attribute on the island's script", () => {
  it("carries the id of the envelope the data belongs to", () => {
    const html = renderEnvelope({
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "html",
      markup: "",
      data: {},
    });
    expect(html).toContain(`<script type="application/json" ${ISLAND_ATTRIBUTE}="a7f3">`);
  });

  it("is none of the envelope's own, so a search for an island never finds an envelope", () => {
    expect(ISLAND_ATTRIBUTE).toMatch(/^data-[a-z]+$/);
    expect(Object.values(ENVELOPE_ATTRIBUTE)).not.toContain(ISLAND_ATTRIBUTE);
  });
});
