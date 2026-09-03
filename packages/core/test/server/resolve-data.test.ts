// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineService, resolveData } from "@assemblejs/core";
import type { AssemblyView } from "@assemblejs/core";

const context = { query: new URLSearchParams("name=ada"), params: {} };
const view = (over: Partial<AssemblyView> = {}): AssemblyView => ({
  renderer: "html",
  markup: () => "",
  ...over,
});

describe("the one function both endpoints call", () => {
  it("runs the view's services and merges what they returned", async () => {
    const data = await resolveData(
      view({
        services: [
          defineService({
            name: "greeting",
            run: ({ query }) => ({ greeting: query.get("name") ?? "" }),
          }),
          defineService({ name: "count", run: () => ({ count: 2 }) }),
        ] as never,
      }),
      context,
    );
    expect(data).toEqual({ greeting: "ada", count: 2 });
  });

  it("lets the view's own data win over what a service returned", async () => {
    const data = await resolveData(
      view({
        services: [
          defineService({ name: "base", run: () => ({ title: "from a service" }) }),
        ] as never,
        data: () => ({ title: "from the view" }),
      }),
      context,
    );
    // The inline form is the more specific of the two, so it wins, the same way a later service
    // wins over an earlier one.
    expect(data["title"]).toBe("from the view");
  });

  it("is an empty object for a view that declares neither", async () => {
    expect(await resolveData(view(), context)).toEqual({});
  });

  it("gives a service the request, not another assembly's", async () => {
    const data = await resolveData(
      view({
        services: [
          defineService({ name: "echo", run: ({ query }) => ({ seen: query.get("name") ?? "" }) }),
        ] as never,
      }),
      context,
    );
    expect(data["seen"]).toBe("ada");
  });
});
