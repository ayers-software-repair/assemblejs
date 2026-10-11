// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderEnvelope } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { islandData } from "@assemblejs/mcp";

const envelope = (id: string, data: Record<string, string>, markup = "<p>x</p>"): string =>
  renderEnvelope({ id, name: "cart", view: "default", renderer: "html", markup, data });

describe("the data an envelope's island carries", () => {
  it("is what the server put in the island of the envelope with that id, markup in it and all", () => {
    const html = envelope("outer", { note: "</script><b>&" }, envelope("inner", { sku: "a1" }));
    expect(islandData(html, "outer")).toEqual({ note: "</script><b>&" });
    expect(islandData(html, "inner")).toEqual({ sku: "a1" });
  });

  it("is empty where the markup has no island by that id, or one that is not its payload", () => {
    expect(islandData(envelope("outer", { a: "1" }), "other")).toEqual({});
    expect(
      islandData('<script type="application/json" data-assembly="x">[1]</script>', "x"),
    ).toEqual({});
    expect(islandData('<script type="application/json" data-assembly="x">{"data":', "x")).toEqual(
      {},
    );
  });
});
