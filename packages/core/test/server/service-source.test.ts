// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { serviceSource } from "@assemblejs/core";

describe("how a service is named in a schema problem", () => {
  it("quotes the service's name", () => {
    expect(serviceSource("greeting")).toBe('service "greeting"');
  });
});
