// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineService, runServices } from "@assemblejs/core";

const context = { query: new URLSearchParams("name=ada"), params: {} };

describe("running an assembly's services", () => {
  it("merges what each returned", async () => {
    // A heterogeneous list on purpose: each service returns its own shape and the merge is
    // what makes them one object.
    const data = await runServices(
      [
        defineService({
          name: "greeting",
          run: ({ query }) => ({ greeting: query.get("name") ?? "" }),
        }),
        defineService({ name: "count", run: () => ({ count: 2 }) }),
      ] as never,
      context,
    );
    expect(data).toEqual({ greeting: "ada", count: 2 });
  });

  it("runs them in the order it settled, not the order they were written", async () => {
    const ran: string[] = [];
    await runServices(
      [
        defineService({
          name: "second",
          after: ["first"],
          run: () => {
            ran.push("second");
            return {};
          },
        }),
        defineService({
          name: "first",
          run: () => {
            ran.push("first");
            return {};
          },
        }),
      ],
      context,
    );
    expect(ran).toEqual(["first", "second"]);
  });

  // A service that declared `after` said it needs the one before it to have FINISHED. Running
  // them concurrently would make that declaration a lie.
  it("waits for each before starting the next", async () => {
    const ran: string[] = [];
    await runServices(
      [
        defineService({
          name: "slow",
          run: async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            ran.push("slow");
            return {};
          },
        }),
        defineService({
          name: "fast",
          after: ["slow"],
          run: () => {
            ran.push("fast");
            return {};
          },
        }),
      ],
      context,
    );
    expect(ran).toEqual(["slow", "fast"]);
  });

  it("lets a later service's key win, which is the same rule as the order", async () => {
    const data = await runServices(
      [
        defineService({ name: "base", run: () => ({ title: "from base" }) }),
        defineService({
          name: "override",
          after: ["base"],
          run: () => ({ title: "from override" }),
        }),
      ],
      context,
    );
    // What runs last has seen the most.
    expect(data["title"]).toBe("from override");
  });

  it("is an empty object when there are no services", async () => {
    expect(await runServices([], context)).toEqual({});
  });
});
