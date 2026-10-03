// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readCapped } from "@assemblejs/core";

const streamed = (chunks: string[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }),
  );

describe("reading a body under a cap", () => {
  it("answers the text when it fits", async () => {
    expect(await readCapped(streamed(["ab", "cd"]), 10)).toBe("abcd");
  });

  it("stops at the cap, however the body arrives", async () => {
    expect(await readCapped(streamed(["abc", "def"]), 4)).toBeUndefined();
    const declared = new Response("abcdef", { headers: { "content-length": "6" } });
    expect(await readCapped(declared, 4)).toBeUndefined();
  });

  it("counts bytes, not characters", async () => {
    expect(await readCapped(streamed(["\u00e9\u00e9"]), 3)).toBeUndefined();
  });
});
