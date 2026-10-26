// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readCappedBytes } from "@asmjs/core";

const streamed = (chunks: Uint8Array[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  );

describe("reading a body's bytes under a cap", () => {
  it("answers the bytes untouched when they fit, whatever they are", async () => {
    const bytes = await readCappedBytes(
      streamed([new Uint8Array([0, 255]), new Uint8Array([128])]),
      10,
    );
    expect(Array.from(bytes ?? [])).toEqual([0, 255, 128]);
  });

  it("stops at the cap, streamed or declared", async () => {
    const streamedOver = streamed([new Uint8Array(3), new Uint8Array(3)]);
    expect(await readCappedBytes(streamedOver, 4)).toBeUndefined();
    const declared = new Response("abcdef", { headers: { "content-length": "6" } });
    expect(await readCappedBytes(declared, 4)).toBeUndefined();
  });

  it("answers an empty body as no bytes", async () => {
    expect((await readCappedBytes(new Response(null, { status: 204 }), 4))?.length).toBe(0);
  });
});
