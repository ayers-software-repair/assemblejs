// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expectTypeOf, it } from "vitest";
import type { SourceChange } from "@asmjs/mcp";

it("requires exact source text and an explicit absent or existing base", () => {
  expectTypeOf<SourceChange>().toEqualTypeOf<{
    readonly path: string;
    readonly before: string | null;
    readonly after: string;
  }>();
});
