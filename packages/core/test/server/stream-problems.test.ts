// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { streamProblems } from "@assemblejs/core";

const streams = new Set(["/api/ticks"]);

describe("what is wrong with the stream a page names", () => {
  it("finds nothing wrong with no stream, or with a streaming api's path on a page with a runtime", () => {
    expect(streamProblems('page "/"', undefined, streams, false)).toEqual([]);
    expect(streamProblems('page "/"', "/api/ticks", streams, true)).toEqual([]);
    expect(streamProblems('page "/"', "/api/ticks?room=1", streams, true)).toEqual([]);
  });

  it("refuses a path that is not a streaming api's without parameters", () => {
    expect(streamProblems('page "/"', "/api/time", streams, true)).toEqual([
      'page "/" opens the stream "/api/time", which is not the path of a streaming api without parameters',
    ]);
  });

  it("refuses a stream on a page whose runtime is never on it", () => {
    expect(streamProblems('page "/"', "/api/ticks", streams, false)).toEqual([
      'page "/" opens a stream and places no assembly of this server\'s with a browser half, so nothing would open it',
    ]);
  });

  it("says nothing of what would open it where the placements could not be read", () => {
    expect(streamProblems('page "/"', "/api/ticks", streams, undefined)).toEqual([]);
    expect(streamProblems('page "/"', "/api/time", streams, undefined)).toHaveLength(1);
  });
});
