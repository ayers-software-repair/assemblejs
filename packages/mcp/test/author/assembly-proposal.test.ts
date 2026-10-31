// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expectTypeOf, it } from "vitest";
import type { AssemblyProposal } from "@asmjs/mcp";

it("exposes exact readonly additions and the session id needed to apply or reject", () => {
  expectTypeOf<AssemblyProposal["id"]>().toEqualTypeOf<string>();
  expectTypeOf<AssemblyProposal["changes"][number]>().toEqualTypeOf<{
    readonly path: string;
    readonly before: null;
    readonly after: string;
  }>();
});
