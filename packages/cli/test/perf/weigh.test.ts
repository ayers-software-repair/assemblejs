// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { gunzipSync, gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { weigh } from "@assemblejs/cli";

describe("weighing a body", () => {
  it("counts its bytes as sent and as gzip would send them", () => {
    const body = new TextEncoder().encode("a".repeat(5000));
    const weight = weigh(body);
    expect(weight.bytes).toBe(5000);
    expect(weight.gzip).toBe(gzipSync(body).byteLength);
    expect(gunzipSync(gzipSync(body)).byteLength).toBe(5000);
  });

  it("weighs nothing as nothing", () => {
    expect(weigh(new Uint8Array())).toEqual({ bytes: 0, gzip: 0 });
  });
});
