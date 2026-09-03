// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readIsland } from "@assemblejs/core/client";

const withIsland = (id: string, json: string): Element => {
  const element = document.createElement("assembly-root");
  element.setAttribute("data-id", id);
  const script = document.createElement("script");
  script.setAttribute("type", "application/json");
  script.setAttribute("data-assembly", id);
  script.textContent = json;
  element.append(script);
  return element;
};

describe("reading an envelope's island", () => {
  it("returns the payload", () => {
    const envelope = withIsland(
      "a7f3",
      `{"id":"a7f3","name":"cart","view":"default","renderer":"html","data":{"total":2},"deferred":false}`,
    );
    expect(readIsland(envelope)?.data).toEqual({ total: 2 });
  });

  // Removal is not tidiness: an island left in the document is re-read by anything that walks
  // the DOM and shown by view-source long after the runtime has the value.
  it("removes the island from the document", () => {
    const envelope = withIsland("a7f3", `{"id":"a7f3","data":{}}`);
    expect(envelope.querySelector("script")).not.toBeNull();
    readIsland(envelope);
    expect(envelope.querySelector("script")).toBeNull();
  });

  it("returns nothing for a static assembly, which has no island", () => {
    const element = document.createElement("assembly-root");
    element.setAttribute("data-id", "a7f3");
    expect(readIsland(element)).toBeUndefined();
  });

  it("returns nothing for an envelope with no id", () => {
    expect(readIsland(document.createElement("assembly-root"))).toBeUndefined();
  });

  // One assembly's malformed island is its own problem: the page keeps its server markup and
  // every other assembly still mounts.
  it("survives a malformed island rather than throwing", () => {
    const envelope = withIsland("a7f3", `{ not json`);
    expect(readIsland(envelope)).toBeUndefined();
    expect(envelope.querySelector("script")).toBeNull();
  });

  it("reads only its own island, not a nested assembly's", () => {
    const outer = withIsland("outer", `{"id":"outer","data":{"which":"outer"}}`);
    const inner = withIsland("inner", `{"id":"inner","data":{"which":"inner"}}`);
    outer.append(inner);
    expect(readIsland(outer)?.data).toEqual({ which: "outer" });
    // The nested one is untouched and still there for its own envelope to read.
    expect(inner.querySelector("script")).not.toBeNull();
  });
});
