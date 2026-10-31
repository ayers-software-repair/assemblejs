// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { build } from "esbuild";
import { createMcpServer, resolveRoot } from "../../packages/mcp/dist/index.js";

/** Hosted proof only: the actual MCP server and client share a disposable real project. */
export async function serveModes() {
  const client = new Client({ name: "academy-mode-proof", version: "0.0.0" });
  const root = await mkdtemp(join(tmpdir(), "academy-modes-"));
  let server;
  let mcp;
  const closeProject = async () => {
    try {
      await client.close();
    } finally {
      try {
        await mcp?.close();
      } finally {
        await rm(root, { recursive: true });
      }
    }
  };
  try {
    mcp = createMcpServer(resolveRoot(root));
    const [a, b] = InMemoryTransport.createLinkedPair();
    await Promise.all([mcp.connect(b), client.connect(a)]);
    const seed = await client.callTool({
      name: "create_project",
      arguments: { name: "academy-shop" },
    });
    if (!JSON.parse(seed.content[0].text).ok) throw new Error("actual project creation failed");
    const bundle = await build({
      stdin: {
        contents: `import { createAssemblyControls } from "./examples/academy/workspace/create-assembly-controls.js";
const client = {
  async callTool(request) {
    const response = await fetch('/call-tool', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result;
  }
};
createAssemblyControls(document.querySelector('main'), client);`,
        resolveDir: process.cwd(),
        sourcefile: "academy-mode-entry.js",
      },
      bundle: true,
      format: "esm",
      platform: "browser",
      write: false,
    });
    const css = await readFile("examples/academy/workspace/assembly-controls.css", "utf8");
    let origin;
    const calls = [];
    server = createServer(async (request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      );
      const send = (status, type, body) => {
        response.writeHead(status, { "Content-Type": type });
        response.end(body);
      };
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (request.method === "POST" && path === "/call-tool") {
        if (request.headers.origin !== origin)
          return send(403, "application/json", '{"error":"origin refused"}');
        try {
          const chunks = [];
          let bytes = 0;
          for await (const chunk of request) {
            bytes += chunk.length;
            if (bytes > 16000) throw new Error("request too large");
            chunks.push(chunk);
          }
          const given = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (
            !["plan_assembly", "apply_assembly_plan", "discard_assembly_plan", "check"].includes(
              given?.name,
            )
          )
            throw new Error("tool refused");
          calls.push(given);
          const reply = await client.callTool(given);
          return send(200, "application/json", JSON.stringify(reply));
        } catch (error) {
          return send(400, "application/json", JSON.stringify({ error: String(error) }));
        }
      }
      if (request.method !== "GET") return send(405, "text/plain", "method refused");
      if (path === "/modes.js") return send(200, "text/javascript", bundle.outputFiles[0].text);
      if (path === "/modes.css") return send(200, "text/css", css);
      if (path !== "/") return send(404, "text/plain", "not found");
      send(
        200,
        "text/html",
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Academy mode controls proof</title><link rel="stylesheet" href="/modes.css"><main><h1>Assembly mode controls</h1><p>Real project tools. Preview and calculator workflow acceptance remain open.</p></main><script type="module" src="/modes.js"></script></html>',
      );
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    const file = (name) => {
      if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error("invalid fixture name");
      return join(root, "src", "assemblies", name, `${name}.html`);
    };
    return {
      origin,
      calls,
      source(name) {
        return existsSync(file(name)) ? readFileSync(file(name), "utf8") : null;
      },
      outside(name, text) {
        mkdirSync(join(root, "src", "assemblies", name), { recursive: true });
        writeFileSync(file(name), text);
      },
      async close() {
        try {
          await new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        } finally {
          await closeProject();
        }
      },
    };
  } catch (error) {
    try {
      if (server?.listening) await new Promise((resolve) => server.close(resolve));
    } finally {
      await closeProject();
    }
    throw error;
  }
}
