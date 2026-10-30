// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { readFileSync, renameSync, writeFileSync } from "node:fs";

const records = [];
const root = "academy-sdk";
const cli = ["node_modules/@asmjs/cli/dist/bin.js"];
let server;
let terminal = false;
const report = (phase) => {
  if (terminal) return;
  writeFileSync(".probe-result.tmp", JSON.stringify({ phase, records }));
  renameSync(".probe-result.tmp", "probe-result.json");
  terminal = phase === "failed" || phase === "stopped";
};

async function command(program, args, cwd = ".", expected = 0) {
  const child = spawn(program, args, { cwd, env: process.env });
  const record = { program, args, output: "", exit: null, timedOut: false };
  let finished = false;
  records.push(record);
  report("running");
  const collect = (chunk) => {
    if (finished) return;
    record.output = (record.output + chunk).slice(-16000);
    report("running");
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);
  let timer;
  try {
    record.exit = await Promise.race([
      new Promise((done, reject) => {
        child.once("error", reject);
        child.once("close", done);
      }),
      new Promise((_done, reject) => {
        timer = setTimeout(() => {
          record.timedOut = true;
          child.kill("SIGKILL");
          reject(new Error(`${program} exceeded its command deadline`));
        }, 90000);
      }),
    ]);
    report("running");
    if (record.timedOut || record.exit !== expected)
      throw new Error(`${program} exited ${record.exit}, expected ${expected}`);
    return record.output;
  } finally {
    finished = true;
    clearTimeout(timer);
  }
}

try {
  const version = "1.0.0-next.2";
  if (Number.parseInt(process.versions.node.split(".")[0], 10) < 22)
    throw new Error("Node 22 required");
  records.push({ node: process.versions.node });
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
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
  for (const dependencies of [pkg.dependencies, pkg.devDependencies]) {
    for (const name of Object.keys(dependencies))
      if (name.startsWith("@asmjs/")) dependencies[name] = version;
  }
  pkg.devDependencies.typescript = "6.0.3";
  pkg.devDependencies["@types/node"] = "26.4.1";
  writeFileSync(packagePath, JSON.stringify(pkg));
  await command(
    "npm",
    [
      "install",
      "--save-exact",
      "--fetch-retries=0",
      "--fetch-timeout=20000",
      `@asmjs/renderer-react@${version}`,
      "react@19.2.8",
      "react-dom@19.2.8",
      "@types/react@19.2.18",
      "@types/react-dom@19.2.5",
    ],
    root,
  );
  await command("node", [...cli, "add", "assembly", "react-probe", "--renderer", "react"], root);
  const parent = JSON.parse(readFileSync("probe-parent.json", "utf8"));
  writeFileSync(
    `${root}/assemblejs.config.ts`,
    'import { contentSecurityPolicy, defineConfig } from "@asmjs/core";\n' +
      "const policy = contentSecurityPolicy([]);\n" +
      'if (!policy.includes("frame-ancestors \'self\'")) throw new Error("framing policy changed");\n' +
      "export default defineConfig({ contentSecurityPolicy: policy.replace(\"frame-ancestors 'self'\", " +
      JSON.stringify("frame-ancestors 'self' https://stackblitz.com " + parent.origin) +
      ") });\n",
  );
  const pagePath = `${root}/src/pages/home/home.html`;
  const original = readFileSync(pagePath, "utf8");
  const page = original.replace("</body>", '<assembly name="react-probe"></assembly></body>');
  if (page === original) throw new Error("page insertion anchor missing");
  writeFileSync(
    pagePath,
    page.replace("</body>", '<assembly name="missing-probe"></assembly></body>'),
  );
  const bad = await command("node", [...cli, "check"], root, 1);
  if (!bad.includes("a-placement-names-an-assembly") || !bad.includes("missing-probe"))
    throw new Error("known-bad check missed its rule");
  writeFileSync(pagePath, page);
  await command("node", [...cli, "check"], root);
  await command("npm", ["run", "typecheck"], root);
  server = spawn("node", [...cli, "dev"], {
    cwd: root,
    env: { ...process.env, ASSEMBLEJS_PORT: "3210" },
  });
  const output = { program: "dev server", output: "", exit: null };
  records.push(output);
  const closed = new Promise((done, reject) => {
    server.once("error", reject);
    server.once("close", (code, signal) => done({ code, signal }));
  });
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (chunk) => {
      output.output = (output.output + chunk).slice(-16000);
      report("ready");
    });
  report("ready");
  await new Promise((done, reject) => {
    const timer = setInterval(() => {
      try {
        if (JSON.parse(readFileSync("probe-control.json", "utf8")).action === "stop") {
          clearInterval(timer);
          done();
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, 500);
    closed.then(() => {
      clearInterval(timer);
      reject(new Error("dev server exited before stop"));
    }, reject);
  });
  server.kill();
  let stopTimer;
  try {
    output.exit = await Promise.race([
      closed,
      new Promise((_done, reject) => {
        stopTimer = setTimeout(() => reject(new Error("dev process did not stop")), 5000);
      }),
    ]);
  } finally {
    clearTimeout(stopTimer);
  }
  report("stopped");
} catch (error) {
  server?.kill("SIGKILL");
  records.push({ failure: String(error) });
  report("failed");
  process.exitCode = 1;
}
