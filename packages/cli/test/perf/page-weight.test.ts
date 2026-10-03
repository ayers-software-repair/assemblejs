// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageWeight } from "@assemblejs/cli";

describe("what one page sends a visitor before anything mounts", () => {
  it("is its document, its stylesheets and its module scripts", () => {
    const none = { bytes: 0, gzip: 0 };
    const weight: PageWeight = { route: "/", document: none, styles: none, scripts: none };
    expect(Object.keys(weight)).toEqual(["route", "document", "styles", "scripts"]);
  });
});
