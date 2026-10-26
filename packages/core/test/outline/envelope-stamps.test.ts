// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { EnvelopeStamps } from "@asmjs/core/outline";

describe("when each envelope came to be on a page and came alive", () => {
  it("answers nothing for an envelope it never saw arrive or mount", () => {
    const stamps: EnvelopeStamps = {
      arrived: () => undefined,
      mounted: () => undefined,
      watch: () => undefined,
      stop: () => undefined,
    };
    const envelope = document.createElement("assembly-root");
    expect(stamps.arrived(envelope)).toBeUndefined();
    expect(stamps.mounted(envelope)).toBeUndefined();
  });
});
