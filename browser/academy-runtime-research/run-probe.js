// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/* global document, crossOriginIsolated, location */
import { WebContainer } from "@webcontainer/api";

const version = "1.0.0-next.2";
const renderers = ["preact", "react", "vue", "svelte", "solid", "lit"];
const templates = ["ejs", "handlebars", "markdown", "nunjucks", "pug"];
const records = [];
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const preview = document.querySelector("#preview");
const stop = document.querySelector("#stop");
if (!status || !result || !preview || !stop) throw new Error("incomplete research fixture");

let runtime;
let server;
const report = (phase) => {
  status.textContent = phase;
  result.textContent = JSON.stringify({ phase, records });
};

/** Commands retain their actual exit and bounded output, including the known-bad check. */
async function command(program, args, options = {}, expected = 0) {
  const child = await runtime.spawn(program, args, options);
  const record = { program, args, output: "", exit: null, timedOut: false };
  records.push(record);
  report(`running ${program}`);
  const reading = child.output.pipeTo(
    new WritableStream({
      write(text) {
        record.output = (record.output + text).slice(-16000);
        report(status.textContent);
      },
    }),
  );
  const deadline = setTimeout(() => {
    record.timedOut = true;
    report(`${program} timed out`);
    child.kill();
  }, 90000);
  try {
    record.exit = await child.exit;
    await reading;
    report(`${program}: ${String(record.exit)}`);
    if (record.timedOut || record.exit !== expected) {
      throw new Error(`${program} exited ${String(record.exit)}, expected ${String(expected)}`);
    }
    return record.output;
  } finally {
    clearTimeout(deadline);
  }
}

stop.addEventListener("click", async () => {
  try {
    server?.kill();
    if (server) records.push({ stoppedServerExit: await server.exit });
    runtime?.teardown();
    report("stopped");
  } catch (error) {
    records.push({ stopFailure: String(error) });
    report("failed");
  }
});

try {
  if (!crossOriginIsolated) throw new Error("research origin is not cross-origin isolated");
  report("booting");
  runtime = await WebContainer.boot();
  const nodeVersion = await command("node", ["--version"]);
  const major = Number.parseInt(nodeVersion.trim().replace(/^v/, "").split(".")[0], 10);
  if (!Number.isInteger(major) || major < 22)
    throw new Error("the framework requires Node 22 or newer");
  await command("npm", [
    "exec",
    "--yes",
    `--package=@asmjs/cli@${version}`,
    "--",
    "assemblejs",
    "new",
    "academy-probe",
  ]);
  const root = "academy-probe";
  const manifestPath = `${root}/package.json`;
  const manifest = JSON.parse(await runtime.fs.readFile(manifestPath, "utf8"));
  for (const dependencies of [manifest.dependencies, manifest.devDependencies]) {
    for (const name of Object.keys(dependencies)) {
      if (name.startsWith("@asmjs/")) dependencies[name] = version;
    }
  }
  manifest.devDependencies["typescript"] = "6.0.3";
  manifest.devDependencies["@types/node"] = "26.4.1";
  await runtime.fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  report("installing exact framework and peer versions");
  await command(
    "npm",
    [
      "install",
      "--save-exact",
      "--verbose",
      "--fetch-retries=0",
      "--fetch-timeout=20000",
      ...[...renderers, "templates"].map((name) => `@asmjs/renderer-${name}@${version}`),
      `@asmjs/create@${version}`,
      `@asmjs/devtools@${version}`,
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

  // Only this isolated controller may frame the generated research project.
  const defaultFramePolicy = JSON.stringify("frame-ancestors 'self'");
  const framePolicy = JSON.stringify("frame-ancestors 'self' " + location.origin);
  await runtime.fs.writeFile(
    root + "/assemblejs.config.ts",
    'import { contentSecurityPolicy, defineConfig } from "@asmjs/core";\n' +
      "const policy = contentSecurityPolicy([]);\n" +
      "if (!policy.includes(" +
      defaultFramePolicy +
      ')) throw new Error("default framing policy changed");\n' +
      "export default defineConfig({ contentSecurityPolicy: policy.replace(" +
      defaultFramePolicy +
      ", " +
      framePolicy +
      ") });\n",
  );
  records.push({ allowedPreviewParent: location.origin });

  const cli = ["node_modules/@asmjs/cli/dist/bin.js"];
  for (const renderer of [...renderers, ...templates]) {
    await command(
      "node",
      [...cli, "add", "assembly", `${renderer}-probe`, "--renderer", renderer],
      { cwd: root },
    );
  }
  const pagePath = `${root}/src/pages/home/home.html`;
  const starter = await runtime.fs.readFile(pagePath, "utf8");
  const page = starter.replace(
    "</body>",
    [...renderers, ...templates]
      .map((name) => `<assembly name="${name}-probe"></assembly>`)
      .join("\n") + "\n</body>",
  );
  if (page === starter) throw new Error("starter page insertion anchor was not found");
  await runtime.fs.writeFile(
    pagePath,
    page.replace("</body>", '<assembly name="missing-probe"></assembly></body>'),
  );
  const rejected = await command("node", [...cli, "check"], { cwd: root }, 1);
  if (!rejected.includes("missing-probe") || !rejected.includes("a-placement-names-an-assembly")) {
    throw new Error("check did not identify the deliberately missing assembly");
  }
  await runtime.fs.writeFile(pagePath, page);
  await command("node", [...cli, "check"], { cwd: root });
  await command("npm", ["run", "typecheck"], { cwd: root });

  const ready = new Promise((resolve) => {
    runtime.on("server-ready", (port, url) => {
      if (port === 3210) resolve(url);
    });
  });
  server = await runtime.spawn("node", ["dist/server.js"], {
    cwd: root,
    env: { ASSEMBLEJS_PORT: "3210" },
  });
  const serverRecord = { program: "built server", output: "" };
  records.push(serverRecord);
  server.output
    .pipeTo(
      new WritableStream({
        write(text) {
          serverRecord.output = (serverRecord.output + text).slice(-16000);
          report(status.textContent);
        },
      }),
    )
    .catch((error) => {
      serverRecord.output += `\n${String(error)}`;
    });
  preview.src = await Promise.race([
    ready,
    server.exit.then((code) => {
      throw new Error(`built server exited ${String(code)}`);
    }),
  ]);
  report("ready");
} catch (error) {
  records.push({ failure: String(error) });
  server?.kill();
  runtime?.teardown();
  report("failed");
}
