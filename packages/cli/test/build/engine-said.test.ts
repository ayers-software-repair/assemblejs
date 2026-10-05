// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { engineSaid } from "@assemblejs/cli";

describe("what an engine said, on one line", () => {
  it("keeps the message up to its first blank line, without the lines that only draw", () => {
    const ejs = new Error(
      "Unexpected token 'catch' while compiling ejs\n\nIf the above error is not helpful, you may want to try EJS-Lint:\nhttps://example.invalid/",
    );
    expect(engineSaid(ejs)).toBe("Unexpected token 'catch' while compiling ejs");
    const handlebars = new Error(
      "Parse error on line 1:\n...data.n}}never closed\n-----------------------^\nExpecting 'OPEN_ENDBLOCK', got 'EOF'",
    );
    expect(engineSaid(handlebars)).toBe(
      "Parse error on line 1: ...data.n}}never closed Expecting 'OPEN_ENDBLOCK', got 'EOF'",
    );
    expect(engineSaid(new Error("(unknown path)\n  parseIf: expected endif"))).toBe(
      "(unknown path) parseIf: expected endif",
    );
  });

  it("says so for an error with no message, and reads what is not an error", () => {
    expect(engineSaid(new Error(""))).toBe("the engine gave no message");
    expect(engineSaid("thrown as text")).toBe("thrown as text");
  });
});
