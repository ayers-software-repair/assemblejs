// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ServeOptions } from "@assemblejs/core";

describe("what serve is handed", () => {
  it("is a server's options without the configuration, which serve reads itself", () => {
    const options: ServeOptions = { assemblies: [], version: "1.0.0", outline: true };
    expect(options.assemblies).toEqual([]);
    // @ts-expect-error the configuration is read from the environment, never passed
    const configured: ServeOptions = { assemblies: [], config: undefined };
    expect(configured.assemblies).toEqual([]);
  });
});
