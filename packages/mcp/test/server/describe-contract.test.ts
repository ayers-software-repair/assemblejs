// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer, defineAssembly } from "@assemblejs/core";
import type { App, Config } from "@assemblejs/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { describeContract } from "@assemblejs/mcp";

// A real server with one assembly: what the contract says is held to what this server sends.
const config: Config = { mode: "production", host: "127.0.0.1", port: 0, auth: undefined };
const hello = defineAssembly({
  name: "hello",
  views: {
    default: {
      renderer: "html",
      data: () => ({ greeting: "Hello" }),
      markup: ({ data }) => `<p>${String(data["greeting"])}</p>`,
    },
  },
});
let app: App;
beforeAll(async () => {
  app = await createServer({ config, assemblies: [hello], version: "v1" });
});
afterAll(async () => {
  await app.close();
});
const contract = describeContract();
const names = (terms: readonly { readonly name: string }[]) => terms.map((term) => term.name);

describe("the contract, held to a real server", () => {
  it("names the content endpoint's answer: its headers, its envelope, its island", async () => {
    const answer = await app.inject({ url: `${contract.prefix}/hello/` });
    expect(answer.statusCode).toBe(200);
    expect(answer.headers["content-type"]).toBe("text/html; charset=utf-8");
    for (const header of names(contract.responseHeaders))
      expect(answer.headers).toHaveProperty(header);
    const { element, always, island } = contract.envelope;
    expect(answer.body.startsWith(`<${element} `)).toBe(true);
    expect(answer.body.endsWith(`</${element}>`)).toBe(true);
    for (const attribute of names(always))
      expect(answer.body).toMatch(new RegExp(` ${attribute}="`));
    expect(answer.body).toContain(`<${island.element} type="${island.type}" ${island.attribute}="`);
    // The bare name serves the default view: the same answer but for the id each was given.
    const byView = await app.inject({ url: `${contract.prefix}/hello/${contract.defaultView}/` });
    const ID = /[0-9a-f]{8}/g;
    expect(byView.body.replace(ID, "id")).toBe(answer.body.replace(ID, "id"));
  });

  it("names the data endpoint's answer and the manifest's every field", async () => {
    const data = await app.inject({ url: `${contract.prefix}/hello/${contract.defaultView}/api/` });
    expect(data.statusCode).toBe(200);
    expect(data.json()).toEqual({ greeting: "Hello" });
    const manifest = await app.inject({
      url: `${contract.prefix}/hello/${contract.defaultView}/manifest/`,
    });
    expect(manifest.statusCode).toBe(200);
    const sent = manifest.json() as Record<string, unknown>;
    expect(Object.keys(sent).sort()).toEqual([...names(contract.manifest)].sort());
    expect(sent["contract"]).toBe(contract.contract);
  });

  it("names the refusals: a header that does not fit its shape, and an assembly the server has not", async () => {
    const depth = contract.requestHeaders.find((header) => header.name.endsWith("depth"));
    const malformed = await app.inject({
      url: `${contract.prefix}/hello/`,
      headers: { [depth?.name ?? ""]: "many" },
    });
    expect(malformed.statusCode).toBe(400);
    expect(contract.endpoints[0]?.refuses).toContain("400");
    const missing = await app.inject({ url: `${contract.prefix}/nobody/` });
    expect(missing.statusCode).toBe(404);
    expect(contract.endpoints[0]?.refuses).toContain("404");
    expect(contract.requestHeaders.map((header) => header.name)).toHaveLength(5);
  });
});
