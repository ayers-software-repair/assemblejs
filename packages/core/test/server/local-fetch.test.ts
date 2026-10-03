// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, localFetch } from "@assemblejs/core";
import type { AssemblyRequest, LogLine } from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  views: { default: { renderer: "html", markup: () => "<p>hi</p>" } },
});
const broken = defineAssembly({
  name: "broken",
  views: {
    default: {
      renderer: "html",
      markup: () => {
        throw new Error("connection to postgres://user:hunter2@db refused");
      },
    },
  },
});

const request = (name: string, view = "default"): AssemblyRequest => ({
  name,
  view,
  id: "a7f3",
  page: "p",
  depth: 1,
  path: [],
  query: new URLSearchParams(),
  headers: {},
  signal: new AbortController().signal,
});

describe("the composer's local transport", () => {
  const logged: LogLine[] = [];
  const fetch = localFetch(
    new Map([
      ["hello", hello],
      ["broken", broken],
    ]),
    (line) => logged.push(line),
  );

  it("renders a local assembly in its envelope, stamped with the id the parent allocated", async () => {
    const answer = await fetch(request("hello"));
    expect(answer.ok).toBe(true);
    if (answer.ok) {
      expect(answer.source).toBe("local");
      expect(answer.html).toContain('data-id="a7f3"');
    }
  });

  it("answers an unknown assembly or view as a failure, never a throw", async () => {
    expect((await fetch(request("nope"))).ok).toBe(false);
    expect((await fetch(request("hello", "wide"))).ok).toBe(false);
  });

  it("logs a render that throws against an id, and keeps the message out of the answer", async () => {
    const answer = await fetch(request("broken"));
    expect(answer.ok).toBe(false);
    if (!answer.ok) {
      expect(JSON.stringify(answer)).not.toContain("hunter2");
      expect(logged.at(-1)?.correlationId).toBe(answer.correlationId);
      expect(logged.at(-1)?.message).toContain("hunter2");
    }
  });
});
