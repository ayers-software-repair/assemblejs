// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { start } from "@assemblejs/core/client";
import type { Runtime } from "@assemblejs/core/client";

describe("the runtime", () => {
  it("exposes what is mounted, a way to mount more, and a teardown", () => {
    document.body.innerHTML = "";
    const runtime: Runtime = start({ renderers: {} });
    expect(runtime.mounted.size).toBe(0);
    expect(typeof runtime.mount).toBe("function");
    expect(typeof runtime.unmountAll).toBe("function");
  });
});
