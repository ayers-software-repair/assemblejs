// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NotFound, createServer, defineAssembly, defineService } from "@asmjs/core";
import type { App, Config, LogLine } from "@asmjs/core";

const config: Config = { mode: "production", host: "127.0.0.1", port: 0, auth: undefined };
const failure = { error: { correlationId: expect.any(String) } };

const SKUS = new Set(["kettle-01"]);
const product = defineAssembly({
  name: "product",
  views: {
    default: {
      renderer: "html",
      services: [
        defineService({
          name: "product",
          run: ({ params }) => {
            const sku = params["sku"] ?? "";
            if (!SKUS.has(sku)) throw new NotFound(`no product "${sku}"`);
            return { sku };
          },
        }),
      ],
      markup: ({ data }) => `<p>${String(data["sku"])}</p>`,
    },
  },
});
// Places the product inside itself, so its not-found comes from a level down.
const frame = defineAssembly({
  name: "frame",
  views: {
    default: { renderer: "html", markup: () => '<div><assembly name="product"></assembly></div>' },
  },
});
const sorry = defineAssembly({
  name: "sorry",
  views: { default: { renderer: "html", markup: () => "<p>Nothing is here.</p>" } },
});

const pages = [
  { route: "/product/:sku", template: '<main><assembly name="product"></assembly></main>' },
  { route: "/framed/:sku", template: '<main><assembly name="frame"></assembly></main>' },
  {
    route: "/needed/:sku",
    template: '<main><assembly name="product"></assembly></main>',
    place: { product: { required: true } },
  },
  { route: "/products", template: "<main>every product</main>" },
];
const notFound = { template: '<main><assembly name="sorry"></assembly></main>' };

const logged: LogLine[] = [];
let app: App;
let bare: App;
beforeAll(async () => {
  const assemblies = [product, frame, sorry];
  app = await createServer({
    config,
    log: (line) => logged.push(line),
    assemblies,
    pages,
    notFound,
  });
  bare = await createServer({ config, log: () => undefined, assemblies, pages });
});
afterAll(async () => {
  await app.close();
  await bare.close();
});

describe("the project's not-found page", () => {
  it("answers 404 with the not-found page where a service says not found", async () => {
    const response = await app.inject({ method: "GET", url: "/product/nope-99" });
    expect(response.statusCode).toBe(404);
    expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(response.headers["content-security-policy"]).toBeDefined();
    expect(response.body).toContain("Nothing is here.");
    expect(response.body).not.toContain("nope-99");
  });

  it("logs one line naming the route and the service that said not found", async () => {
    logged.length = 0;
    await app.inject({ method: "GET", url: "/product/nope-99" });
    expect(logged.map((line) => line.message)).toEqual([
      'page "/product/:sku" answered not found: service "product" said not found: no product "nope-99"',
    ]);
  });

  it("answers the page as ever for a thing that exists", async () => {
    const response = await app.inject({ method: "GET", url: "/product/kettle-01" });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("<p>kettle-01</p>");
  });

  it("is answered for a not-found said at any depth, and before a required placement fails", async () => {
    for (const url of ["/framed/nope-99", "/needed/nope-99"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(404);
      expect(response.body, url).toContain("Nothing is here.");
    }
  });

  it("answers an address no route claims", async () => {
    const response = await app.inject({ method: "GET", url: "/no/such/page" });
    expect(response.statusCode).toBe(404);
    expect(response.body).toContain("Nothing is here.");
  });

  it("keeps the failure body under the reserved prefixes, and for what is not a GET", async () => {
    for (const url of ["/_assemblejs/nothing", "/assembly/nothing/nowhere/"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(404);
      expect(response.json(), url).toEqual(failure);
    }
    const posted = await app.inject({ method: "POST", url: "/no/such/page" });
    expect(posted.statusCode).toBe(404);
    expect(posted.json()).toEqual(failure);
  });

  it("answers the failure body under a 404 where the project has none", async () => {
    for (const url of ["/product/nope-99", "/no/such/page"]) {
      const response = await bare.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(404);
      expect(response.json(), url).toEqual(failure);
    }
  });

  it("cannot say not found itself: its own service saying so is the failure body", async () => {
    const lines: LogLine[] = [];
    const looping = await createServer({
      config,
      log: (line) => lines.push(line),
      assemblies: [product],
      notFound: { template: '<main><assembly name="product"></assembly></main>' },
    });
    try {
      const response = await looping.inject({ method: "GET", url: "/nowhere" });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(failure);
      const { correlationId } = (response.json() as { error: { correlationId: string } }).error;
      expect(lines.find((line) => line.correlationId === correlationId)?.message).toContain(
        'service "product" said not found',
      );
    } finally {
      await looping.close();
    }
  });

  it("is checked at boot like any page, but for a route", async () => {
    await expect(
      createServer({
        config,
        log: () => undefined,
        assemblies: [sorry],
        notFound: { template: '<main><assembly name="missing"></assembly></main>' },
      }),
    ).rejects.toThrow(/the not-found page/);
  });
});

describe("an address with a trailing slash", () => {
  it("answers as the address without it", async () => {
    const plain = await app.inject({ method: "GET", url: "/products" });
    const slashed = await app.inject({ method: "GET", url: "/products/" });
    expect(plain.statusCode).toBe(200);
    expect(slashed.statusCode).toBe(200);
    expect(slashed.body).toBe(plain.body);
    expect((await app.inject({ method: "GET", url: "/product/kettle-01/" })).statusCode).toBe(200);
  });

  it("answers an assembly's address without the slash its route is declared with", async () => {
    const declared = await app.inject({ method: "GET", url: "/assembly/sorry/default/" });
    const slashless = await app.inject({ method: "GET", url: "/assembly/sorry/default" });
    for (const answered of [declared, slashless]) {
      expect(answered.statusCode).toBe(200);
      expect(answered.body).toContain("<p>Nothing is here.</p>");
    }
  });
});
