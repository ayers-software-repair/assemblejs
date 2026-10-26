// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readEventOrigins } from "@asmjs/core/client";

describe("reading the remotes a page admits to its bus", () => {
  it("is the meta element's origins, or none for none or an empty one", () => {
    document.head.innerHTML = '<meta name="description" content="https://x.example">';
    expect(readEventOrigins(document)).toEqual([]);
    document.head.innerHTML =
      '<meta name="assemblejs-events" content="https://a.example https://b.example:8443">';
    expect(readEventOrigins(document)).toEqual(["https://a.example", "https://b.example:8443"]);
    document.head.innerHTML = '<meta name="assemblejs-events" content="">';
    expect(readEventOrigins(document)).toEqual([]);
  });
});
