// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { readStreamUrl } from "@assemblejs/core/client";

describe("reading the stream a page names", () => {
  it("is the meta element's content, or undefined for none or an empty one", () => {
    document.head.innerHTML = '<meta name="description" content="/other">';
    expect(readStreamUrl(document)).toBeUndefined();
    document.head.innerHTML += '<meta name="assemblejs-stream" content="/live?room=a">';
    expect(readStreamUrl(document)).toBe("/live?room=a");
    document.head.innerHTML = '<meta name="assemblejs-stream" content="">';
    expect(readStreamUrl(document)).toBeUndefined();
  });
});
