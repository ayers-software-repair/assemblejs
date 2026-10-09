// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssetWeight } from "@assemblejs/cli";

describe("what one thing a page sends weighs", () => {
  it("is its bytes as sent and gzipped", () => {
    const weight: AssetWeight = { bytes: 10, gzip: 30 };
    expect(Object.keys(weight).sort()).toEqual(["bytes", "gzip"]);
  });
});
