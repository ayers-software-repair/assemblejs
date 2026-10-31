// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFile, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { inspectMarketCalculator } from "./inspect-market-calculator.mjs";

/** Hosted proof only: real CLI builds and owned Market servers, not a production sandbox. */
export async function createMarketPreviewRuntime(root, parentOrigin) {
  const children = new Set();
  const controller = new AbortController();
  const builds = [];
  const inspections = [];
  const stopping = new Map();
  let closed = false;
  let inFlight;
  let inspecting;
  let teams;
  let shop;
  const port = () =>
    new Promise((resolvePort, reject) => {
      const probe = createServer();
      probe.once("error", reject);
      probe.listen(0, "127.0.0.1", () => {
        const address = probe.address();
        if (address === null || typeof address === "string") {
          probe.close();
          reject(new Error("no preview port allocated"));
          return;
        }
        probe.close((error) => (error ? reject(error) : resolvePort(String(address.port))));
      });
    });
  const appPort = await port();
  const origin = `http://127.0.0.1:${appPort}`;
  const configPath = join(root, "assemblejs.config.ts");
  const config = readFileSync(configPath, "utf8");
  const imported = 'import { defineConfig, readCookies } from "@asmjs/core";';
  const start = "export default defineConfig({";
  if (config.split(imported).length !== 2 || config.split(start).length !== 2)
    throw new Error("expected canonical Market config for explicit preview framing policy");
  writeFileSync(
    configPath,
    config
      .replace(
        imported,
        'import { contentSecurityPolicy, defineConfig, readCookies } from "@asmjs/core";',
      )
      .replace(
        start,
        `${start}\n  contentSecurityPolicy: contentSecurityPolicy([CATALOG, REVIEWS, FULFILMENT]).replace(\n    "frame-ancestors 'self'",\n    ${JSON.stringify("frame-ancestors 'self' " + parentOrigin)},\n  ),`,
      ),
  );
  const environment = (extra = {}) => {
    const env = { ...process.env, ...extra };
    delete env.NODE_PATH;
    return env;
  };
  const record = (child) => {
    children.add(child);
    child.once("close", () => children.delete(child));
    return child;
  };
  const stopChild = (child) => {
    if (!child || !children.has(child)) return Promise.resolve();
    if (stopping.has(child)) return stopping.get(child);
    const waiting = new Promise((resolveClose, reject) => {
      const alive = () => child.exitCode === null && child.signalCode === null;
      const force = setTimeout(() => {
        if (alive()) child.kill("SIGKILL");
      }, 3000);
      const deadline = setTimeout(() => {
        child.removeListener("close", done);
        clearTimeout(force);
        reject(new Error(`owned child ${child.pid} did not close`));
      }, 5000);
      const done = () => {
        clearTimeout(force);
        clearTimeout(deadline);
        resolveClose();
      };
      child.once("close", done);
      if (alive()) child.kill("SIGTERM");
    });
    const result = waiting.finally(() => stopping.delete(child));
    stopping.set(child, result);
    return result;
  };
  const stopAll = async () => {
    const results = await Promise.allSettled([...children].map(stopChild));
    teams = undefined;
    shop = undefined;
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
  };
  const build = async (directory) => {
    if (closed) throw new Error("preview runtime closed");
    await new Promise((resolveBuild, reject) => {
      const child = execFile(
        process.execPath,
        [resolve("packages/cli/dist/bin.js"), "build", "--cwd", directory],
        {
          cwd: process.cwd(),
          env: environment(),
          signal: controller.signal,
          timeout: 45000,
          maxBuffer: 1048576,
        },
        (error, stdout, stderr) => {
          builds.push({ project: directory, ok: !error, stdout, stderr });
          if (error) reject(new Error(`actual CLI build failed: ${String(error)}\n${stderr}`));
          else resolveBuild();
        },
      );
      record(child);
    });
  };
  const serve = async (directory, selectedPort, extra = {}) => {
    if (closed) throw new Error("preview runtime closed");
    const child = record(
      spawn(process.execPath, ["dist/server.js"], {
        cwd: directory,
        env: environment({ ...extra, ASSEMBLEJS_HOST: "127.0.0.1", ASSEMBLEJS_PORT: selectedPort }),
        signal: controller.signal,
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    return new Promise((resolveServer, reject) => {
      let stdout = "";
      let stderr = "";
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`server did not listen: ${directory}\n${stdout}\n${stderr}`));
        }
      }, 15000);
      child.stdout.on("data", (chunk) => {
        stdout = (stdout + String(chunk)).slice(-8192);
        const found = /listening (http:\/\/\S+)/.exec(stdout);
        if (found && !settled) {
          settled = true;
          clearTimeout(timer);
          resolveServer({ child, origin: found[1] });
        }
      });
      child.stderr.on("data", (chunk) => {
        stderr = (stderr + String(chunk)).slice(-8192);
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      child.once("close", (code, signal) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(new Error(`server exited ${code ?? signal}: ${directory}\n${stderr}`));
        }
      });
    });
  };
  const rebuild = async () => {
    if (closed || inFlight || inspecting) throw new Error("preview runtime is closed or busy");
    const operation = (async () => {
      if (!teams) {
        const origins = {};
        for (const [team, variable] of [
          ["catalog", "CATALOG_ORIGIN"],
          ["reviews", "REVIEWS_ORIGIN"],
          ["fulfilment", "FULFILMENT_ORIGIN"],
        ]) {
          const directory = resolve("examples/market", team);
          await build(directory);
          let selectedPort = await port();
          while (selectedPort === appPort) selectedPort = await port();
          const started = await serve(directory, selectedPort);
          origins[variable] = started.origin;
        }
        teams = origins;
      }
      await stopChild(shop);
      shop = undefined;
      await build(root);
      shop = (await serve(root, appPort, { ...teams, STAFF_KEY: "academy-preview-run-only" }))
        .child;
      const url = `${origin}/p/kb-guji-250`;
      const response = await fetch(url, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
      });
      await response.text();
      if (!response.ok) throw new Error(`actual preview returned ${response.status}`);
      return url;
    })();
    inFlight = operation;
    try {
      return await operation;
    } catch (error) {
      if (!closed) await stopAll();
      throw error;
    } finally {
      inFlight = undefined;
    }
  };
  return {
    origin,
    rebuild,
    async inspect(values) {
      if (closed || inFlight || inspecting || !shop || !children.has(shop))
        throw new Error("Build a preview before inspecting it; wait for any current operation.");
      const operation = (async () => {
        try {
          const result = await inspectMarketCalculator(
            origin,
            values,
            AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
          );
          inspections.push({
            values: [...values],
            received: true,
            url: result.url,
            htmlBytes: Buffer.byteLength(result.html),
            quotes: result.quotes,
          });
          return result;
        } catch (error) {
          inspections.push({ values, received: false, error: String(error) });
          throw error;
        }
      })();
      inspecting = operation;
      try {
        return await operation;
      } finally {
        inspecting = undefined;
      }
    },
    inspections() {
      return [...inspections];
    },
    active() {
      return [...children].map((child) => child.pid);
    },
    builds() {
      return [...builds];
    },
    async stop() {
      if (inFlight || inspecting)
        throw new Error("wait for the current preview operation before stopping");
      await stopAll();
    },
    async close() {
      const inspection = inspecting;
      closed = true;
      controller.abort();
      await stopAll();
      await inFlight?.catch(() => {});
      await inspection?.catch(() => {});
    },
  };
}
