// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  appendFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";
import { build } from "esbuild";
import { afterAll, describe, expect, it } from "vitest";
import { bundleClient, discoverAssemblies, loadCompilers, realIo } from "@asmjs/build";
import { litHookPlugin } from "../../src/build/lit-hook-plugin.js";

const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
// A Lit assembly, and a React one that imports Lit too, so Lit's element base is reached from
// more than the Lit assemblies and the bundler gives it a file of its own. Nested in the example
// so it resolves the workspace's packages as the example does.
const root = mkdtempSync(join(example, ".dev-lit-hook-"));
for (const name of ["lit-counter", "react-counter"]) {
  cpSync(join(example, "src", "assemblies", name), join(root, "src", "assemblies", name), {
    recursive: true,
  });
}
appendFileSync(
  join(root, "src", "assemblies", "react-counter", "react-counter.react.tsx"),
  `import "lit";\n`,
);
writeFileSync(join(root, "package.json"), "{}");
afterAll(() => rmSync(root, { recursive: true, force: true }));

type Event = "set by Lit's support" | "set by the bundle" | "read";

/**
 * What a browser runs, in order, of Lit's hydration hook, when it loads `start`: each module's
 * imports first, depth first and each once, then its own code in the order written. Lit's
 * support sets the hook to a function that takes `{ LitElement }`; the bundle's own is named.
 */
function hookEvents(start: string): Event[] {
  const events: Event[] = [];
  const done = new Set<string>();
  const visit = (file: string): void => {
    if (done.has(file)) return;
    done.add(file);
    const text = readFileSync(file, "utf8");
    let body = 0;
    for (const statement of parse(text, { ecmaVersion: "latest", sourceType: "module" }).body) {
      if (
        (statement.type === "ImportDeclaration" ||
          statement.type === "ExportNamedDeclaration" ||
          statement.type === "ExportAllDeclaration") &&
        typeof statement.source?.value === "string"
      ) {
        visit(resolve(dirname(file), statement.source.value));
        if (statement.type === "ImportDeclaration") body = Math.max(body, statement.end);
      }
    }
    const code = text.slice(body);
    const found = /litElementHydrateSupport(=(?!=)|\?\.\()/g;
    for (let match = found.exec(code); match !== null; match = found.exec(code)) {
      if (match[1] !== "=") events.push("read");
      else if (code.slice(match.index + match[0].length).startsWith("({")) {
        events.push("set by Lit's support");
      } else events.push("set by the bundle");
    }
  };
  visit(start);
  return events;
}

const scripts = (directory: string): string[] =>
  readdirSync(directory, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".js"))
    .map((file) => join(directory, file));

describe("Lit's element base in the browser bundle", () => {
  it("reads the hook just after setting the bundle's own, whichever file loads first", async () => {
    const { assemblies } = discoverAssemblies(root);
    const { compilers } = await loadCompilers(root, assemblies);
    await bundleClient(root, assemblies, compilers, { ...realIo, log: () => undefined });
    const files = scripts(join(root, "dist", "client"));
    // The base is a file of its own, which a split bundle may run before anything else.
    const reading = files.filter((file) =>
      readFileSync(file, "utf8").includes("litElementHydrateSupport?.("),
    );
    expect(reading).toHaveLength(1);
    for (const start of files) {
      const events = hookEvents(start);
      events.forEach((event, at) => {
        if (event === "read") expect(events[at - 1], start).toBe("set by the bundle");
      });
    }
    expect(hookEvents(reading[0] ?? "")).toContain("read");
  });

  it("refuses a version of Lit whose element base does not read the hook", async () => {
    const base = join(mkdtempSync(join(tmpdir(), "lit-base-")), "lit-element", "lit-element.js");
    mkdirSync(dirname(base));
    writeFileSync(base, "export class LitElement {}\n");
    await expect(
      build({
        entryPoints: [base],
        bundle: true,
        write: false,
        logLevel: "silent",
        plugins: [litHookPlugin(root)],
      }),
    ).rejects.toThrow(
      /lit-element\.js is Lit's element base and no longer reads its hydration hook/,
    );
  });
});
