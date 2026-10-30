// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/* global document, crossOriginIsolated */
import { Vivari } from "@vivari/core";
import { boundedOperation } from "./bounded-operation.js";

const status = document.querySelector("#status");
const result = document.querySelector("#result");
if (!status || !result) throw new Error("incomplete framework-build fixture");
const records = [];
const renderers = ["preact", "react", "vue", "svelte", "solid", "lit"];
const templates = ["ejs", "handlebars", "markdown", "nunjucks", "pug"];
const root = "academy-open-build";
const version = "1.0.0-next.2";
let runtime;
let terminal = false;
const report = (phase) => {
  if (terminal) return;
  status.textContent = phase;
  result.textContent = JSON.stringify({ phase, records });
  terminal = phase === "passed" || phase === "failed";
};
async function command(program, args, options = {}, expected = 0) {
  const child = await boundedOperation(runtime.spawn(program, args, options), "spawn");
  const record = { program, args, output: "", exit: null };
  records.push(record);
  report("running");
  const reading = child.output.pipeTo(
    new WritableStream({
      write(chunk) {
        record.output = (record.output + chunk).slice(-16000);
        report("running");
      },
    }),
  );
  try {
    [record.exit] = await boundedOperation(
      Promise.all([child.exit, reading]),
      `${program} exit/output`,
      90000,
    );
    if (record.exit !== expected)
      throw new Error(`${program} exited ${record.exit}, expected ${expected}`);
    return record.output;
  } catch (error) {
    child.kill();
    throw error;
  }
}
const read = (path) => boundedOperation(runtime.fs.readFile(path, "utf-8"), `read ${path}`);
const write = (path, text) => boundedOperation(runtime.fs.writeFile(path, text), `write ${path}`);

try {
  if (!crossOriginIsolated) throw new Error("isolated research origin required");
  report("booting");
  runtime = await boundedOperation(Vivari.boot({ serviceWorkerUrl: false }), "boot", 30000);
  const npm = await command("npm", ["--version"]);
  if (npm.trim() !== "10.9.2") throw new Error(`unexpected npm: ${npm}`);
  const node = await command("node", ["--version"]);
  const major = Number.parseInt(node.trim().replace(/^v/, "").split(".")[0], 10);
  if (!Number.isInteger(major) || major < 22)
    throw new Error("runtime must report Node22 or newer");
  records.push({
    reportedNodeVersion: node.trim(),
    npmVersion: npm.trim(),
    nativeBuildNotVerified: true,
  });
  await command("npm", [
    "exec",
    "--yes",
    `--package=@asmjs/cli@${version}`,
    "--",
    "assemblejs",
    "new",
    root,
  ]);
  const packagePath = `${root}/package.json`;
  const pkg = JSON.parse(await read(packagePath));
  for (const dependencies of [pkg.dependencies, pkg.devDependencies]) {
    for (const name of Object.keys(dependencies))
      if (name.startsWith("@asmjs/")) dependencies[name] = version;
  }
  pkg.devDependencies.typescript = "6.0.3";
  pkg.devDependencies["@types/node"] = "26.4.1";
  await write(packagePath, JSON.stringify(pkg));
  await command(
    "npm",
    [
      "install",
      "--save-exact",
      "--fetch-retries=0",
      "--fetch-timeout=20000",
      ...[...renderers, "templates"].map((name) => `@asmjs/renderer-${name}@${version}`),
      "preact@11.0.0",
      "react@19.2.8",
      "react-dom@19.2.8",
      "@types/react@19.2.18",
      "@types/react-dom@19.2.5",
      "vue@3.5.43",
      "svelte@5.57.0",
      "solid-js@1.9.15",
      "lit@3.3.3",
    ],
    { cwd: root },
  );
  const effectivePackages = {};
  for (const name of ["@asmjs/core", "@asmjs/cli", "esbuild", "typescript"]) {
    const data = JSON.parse(await read(`${root}/node_modules/${name}/package.json`));
    effectivePackages[name] = { name: data.name, version: data.version };
  }
  records.push({ effectivePackages });
  const cli = ["node_modules/@asmjs/cli/dist/bin.js"];
  for (const renderer of [...renderers, ...templates]) {
    await command(
      "node",
      [...cli, "add", "assembly", `${renderer}-probe`, "--renderer", renderer],
      { cwd: root },
    );
  }
  const pagePath = `${root}/src/pages/home/home.html`;
  const original = await read(pagePath);
  const page = original.replace(
    "</body>",
    [...renderers, ...templates]
      .map((name) => `<assembly name="${name}-probe"></assembly>`)
      .join("\n") + "</body>",
  );
  if (page === original) throw new Error("page insertion anchor missing");
  await write(
    pagePath,
    page.replace("</body>", '<assembly name="missing-probe"></assembly></body>'),
  );
  const bad = await command("node", [...cli, "check"], { cwd: root }, 1);
  if (!bad.includes("missing-probe") || !bad.includes("a-placement-names-an-assembly"))
    throw new Error("known-bad check missed its rule");
  await write(pagePath, page);
  await command("node", [...cli, "check"], { cwd: root });
  const built = await command("npm", ["run", "typecheck"], { cwd: root });
  if (!built.includes("built 12 assembly(s)"))
    throw new Error("build did not report all assemblies");
  const output = await read(`${root}/dist/server.js`);
  if (output.length === 0) throw new Error("built server is empty");
  runtime.teardown();
  runtime = undefined;
  records.push({
    builtServerBytes: output.length,
    finiteCommandsComplete: true,
    teardownCalled: true,
  });
  report("passed");
} catch (error) {
  records.push({ failure: String(error) });
  try {
    runtime?.teardown();
  } catch (cleanupError) {
    records.push({ cleanupFailure: String(cleanupError) });
  }
  report("failed");
}
