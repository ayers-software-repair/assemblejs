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
import { createCalculatorProject } from "./create-calculator-project.mjs";
import { createMarketPreviewRuntime } from "./create-market-preview-runtime.mjs";
import { sourcePaths } from "./source-paths.mjs";

/** Hosted proof only: the actual MCP server and client share a disposable real project. */
export async function serveModes(kind = "modes") {
  if (!["modes", "calculator", "workspace"].includes(kind)) throw new Error("unknown fixture kind");
  const calculator = kind !== "modes";
  const workspace = kind === "workspace";
  const client = new Client({ name: "academy-mode-proof", version: "0.0.0" });
  const root = await mkdtemp(join(tmpdir(), "academy-modes-"));
  let server;
  let mcp;
  let previewRuntime;
  const removeProject = async () => {
    if (previewRuntime?.active().length)
      throw new Error(`owned preview processes still active; preserved ${root}`);
    await rm(root, { recursive: true });
  };
  const closeProject = async () => {
    try {
      await previewRuntime?.close();
    } finally {
      try {
        await client.close();
      } finally {
        try {
          await mcp?.close();
        } finally {
          await removeProject();
        }
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
    const calculatorFiles = [
      "price-calculator.react.tsx",
      "price-calculator.css",
      "price-calculator.service.ts",
      "request-estimate.ts",
    ];
    const recipe = calculator ? createCalculatorProject(root) : undefined;
    const bundle = await build({
      entryPoints: ["browser/academy-modes/modes-entry.mjs"],
      bundle: true,
      format: "esm",
      platform: "browser",
      write: false,
    });
    const css =
      (
        await Promise.all(
          ["assembly-controls.css", "source-editor.css", "academy-workspace.css"].map((file) =>
            readFile(`examples/academy/workspace/${file}`, "utf8"),
          ),
        )
      ).join("\n") + (workspace ? "\nbody { margin: 0; }" : "");
    let origin;
    const calls = [];
    server = createServer(async (request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" +
          (previewRuntime ? `; frame-src ${previewRuntime.origin}` : ""),
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
            if (bytes > (workspace ? 1000000 : 16000)) throw new Error("request too large");
            chunks.push(chunk);
          }
          const given = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (
            ![
              "plan_assembly",
              "apply_assembly_plan",
              "discard_assembly_plan",
              "check",
              "read_source",
              "read_source_version",
              "plan_page_placement",
              "apply_source_changes",
            ].includes(given?.name)
          )
            throw new Error("tool refused");
          calls.push(given);
          const reply = await client.callTool(given);
          return send(200, "application/json", JSON.stringify(reply));
        } catch (error) {
          return send(400, "application/json", JSON.stringify({ error: String(error) }));
        }
      }
      if (
        request.method === "POST" &&
        ["/preview", "/preview-stop"].includes(path) &&
        previewRuntime
      ) {
        if (request.headers.origin !== origin)
          return send(403, "application/json", '{"error":"origin refused"}');
        try {
          let body = "";
          let bytes = 0;
          for await (const chunk of request) {
            bytes += chunk.length;
            if (bytes > 16) throw new Error("preview request takes no options");
            body += chunk.toString("utf8");
          }
          if (body.trim() !== "{}") throw new Error("preview request takes no options");
          if (path === "/preview")
            return send(
              200,
              "application/json",
              JSON.stringify({ url: await previewRuntime.rebuild() }),
            );
          await previewRuntime.stop();
          return send(
            200,
            "application/json",
            JSON.stringify({ stopped: true, active: previewRuntime.active().length }),
          );
        } catch (error) {
          return send(400, "application/json", JSON.stringify({ error: String(error) }));
        }
      }
      if (request.method !== "GET") return send(405, "text/plain", "method refused");
      if (path === "/workspace-config" && previewRuntime) {
        try {
          return send(
            200,
            "application/json",
            JSON.stringify({ origin: previewRuntime.origin, paths: sourcePaths(root) }),
          );
        } catch (error) {
          return send(400, "application/json", JSON.stringify({ error: String(error) }));
        }
      }
      if (path === "/calculator-recipe" && calculator)
        return send(200, "application/json", JSON.stringify(recipe));
      if (path === "/modes.js") return send(200, "text/javascript", bundle.outputFiles[0].text);
      if (path === "/modes.css") return send(200, "text/css", css);
      if (path !== "/") return send(404, "text/plain", "not found");
      send(
        200,
        "text/html",
        workspace
          ? '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AssembleJS Academy workspace proof</title><link rel="stylesheet" href="/modes.css"><main></main><script type="module" src="/modes.js"></script></html>'
          : calculator
            ? '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Market calculator authoring proof</title><link rel="stylesheet" href="/modes.css"><main><h1>Market calculator authoring</h1><p>Actual source changes. Build and live preview still require runtime verification.</p></main><script type="module" src="/modes.js"></script></html>'
            : '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Academy mode controls proof</title><link rel="stylesheet" href="/modes.css"><main><h1>Assembly mode controls</h1><p>Real project tools. Preview and calculator workflow acceptance remain open.</p></main><script type="module" src="/modes.js"></script></html>',
      );
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    if (workspace) previewRuntime = await createMarketPreviewRuntime(root, origin);
    const file = (name) => {
      if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error("invalid fixture name");
      return join(root, "src", "assemblies", name, `${name}.html`);
    };
    return {
      origin,
      calls,
      runtime: previewRuntime,
      source(name) {
        return existsSync(file(name)) ? readFileSync(file(name), "utf8") : null;
      },
      outside(name, text) {
        mkdirSync(join(root, "src", "assemblies", name), { recursive: true });
        writeFileSync(file(name), text);
      },
      calculatorSource(file) {
        if (!calculator || ![...calculatorFiles, "product.html"].includes(file))
          throw new Error("invalid calculator fixture file");
        const path =
          file === "product.html"
            ? join(root, "src/pages/product/product.html")
            : join(root, "src/assemblies/price-calculator", file);
        return existsSync(path) ? readFileSync(path, "utf8") : null;
      },
      async close() {
        try {
          try {
            await previewRuntime?.close();
          } finally {
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
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
