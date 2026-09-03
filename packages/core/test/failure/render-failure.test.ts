// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderFailure } from "@assemblejs/core";

describe("rendering a failure for the visitor", () => {
  it("is built from the id alone", () => {
    expect(renderFailure("a7f3c1d0")).toEqual({ error: { correlationId: "a7f3c1d0" } });
  });

  // The whole point: whatever went wrong, the visitor is told an id and nothing else.
  it("cannot carry anything from the exception", () => {
    const body = renderFailure("a7f3c1d0");
    const serialised = JSON.stringify(body);
    expect(serialised).toBe(`{"error":{"correlationId":"a7f3c1d0"}}`);
  });
});
