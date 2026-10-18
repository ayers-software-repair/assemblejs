// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { NotFound, defineService, runServices } from "@assemblejs/core";
import type { ServiceDefinition } from "@assemblejs/core";

const context = { query: new URLSearchParams("name=ada"), params: {} };

describe("a service that says not found", () => {
  it("ends the run, its not-found naming the service, and runs nothing after it", async () => {
    const ran: string[] = [];
    const run = runServices(
      [
        defineService({
          name: "product",
          run: () => {
            throw new NotFound('no product "nope-99"');
          },
        }),
        defineService({
          name: "price",
          after: ["product"],
          run: () => {
            ran.push("price");
            return {};
          },
        }),
      ] as never,
      context,
    );
    await expect(run).rejects.toThrow(
      new NotFound('service "product" said not found: no product "nope-99"'),
    );
    await expect(run).rejects.toBeInstanceOf(NotFound);
    expect(ran).toEqual([]);
  });

  it("leaves any other throw as it was thrown", async () => {
    const broke = new Error("the database is down");
    const run = runServices(
      [
        defineService({
          name: "product",
          run: () => {
            throw broke;
          },
        }),
      ],
      context,
    );
    await expect(run).rejects.toBe(broke);
  });
});

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

  it("shows each service's own return to an inspector before merging it", async () => {
    const seen: string[] = [];
    const services: ServiceDefinition[] = [
      defineService({ name: "a", run: () => ({ x: 1 }) }),
      defineService({ name: "b", run: () => ({ y: 2 }) }),
    ];
    await runServices(services, { query: new URLSearchParams(), params: {} }, (service, returned) =>
      seen.push(`${service.name}:${Object.keys(returned).join()}`),
    );
    expect(seen).toEqual(["a:x", "b:y"]);
  });

  it("takes a service of two shapes and drops the members it left out", async () => {
    const seen: string[] = [];
    const service = (coin: boolean) =>
      defineService({
        name: "lookup",
        run: () =>
          coin
            ? { found: false, sku: "x", product: undefined }
            : { found: true, product: { name: "n", note: undefined } },
      });
    const inspect = (_service: unknown, returned: object) =>
      seen.push(Object.keys(returned).join());
    const missing = await runServices([service(true)], context, inspect);
    const found = await runServices([service(false)], context, inspect);
    expect(missing).toEqual({ found: false, sku: "x" });
    expect(Object.hasOwn(missing, "product")).toBe(false);
    expect(found).toEqual({ found: true, product: { name: "n" } });
    expect(Object.keys(found["product"] as object)).toEqual(["name"]);
    expect(seen).toEqual(["found,sku", "found,product"]);
  });
});
