// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { beforeBodyEnd } from "@asmjs/core";

describe("adding markup where a document's body ends", () => {
  it("puts it before the last closing tag a browser would read as the body's", () => {
    expect(beforeBodyEnd("<body><p>x</p></body>", "<i></i>")).toBe("<body><p>x</p><i></i></body>");
    expect(beforeBodyEnd("<body><script>'</body>'</script></body>", "<i></i>")).toBe(
      "<body><script>'</body>'</script><i></i></body>",
    );
  });

  it("puts it last in a template that closes no body, and adds nothing for nothing", () => {
    expect(beforeBodyEnd("<p>x</p>", "<i></i>")).toBe("<p>x</p><i></i>");
    expect(beforeBodyEnd("<body></body>", "")).toBe("<body></body>");
  });
});
