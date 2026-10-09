// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RemoteDefinition } from "@assemblejs/core";

describe("a declared remote", () => {
  it("is an exact origin and the request headers it is given, none by default", () => {
    const remote: RemoteDefinition = { origin: "https://checkout.example.com" };
    expect(remote.forward).toBeUndefined();
  });
});
