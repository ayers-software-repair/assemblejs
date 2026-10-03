// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";
import { discoverApis } from "../discovery/discover-apis.js";
import { discoverAssemblies } from "../discovery/discover-assemblies.js";
import { discoverPages } from "../discovery/discover-pages.js";
import { generateApis } from "../generate/generate-apis.js";
import { generatePages } from "../generate/generate-pages.js";
import { generateProject } from "../generate/generate-project.js";
import { generateRegistry } from "../generate/generate-registry.js";
import type { Io } from "../io/io.js";
import { writeStyles } from "../styles/write-styles.js";
import { buildProblems } from "./build-problems.js";
import { bundleClient } from "./bundle-client.js";
import { describeBuildFailure } from "./describe-build-failure.js";
import { loadSvelteCompiler } from "./load-svelte-compiler.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";
import { sharedOptions } from "./shared-options.js";
import { sourceVersion } from "./source-version.js";

/**
 * Builds a project into `dist/`: `dist/server.js`, which `node` starts with no bundler
 * installed, and `dist/client/`, the browser files it serves.
 *
 * Everything that can refuse refuses before the bundler runs. The browser bundle is built first,
 * because its entry's hashed name is what the server's registry links. The server bundle keeps
 * every package external, so the running server imports its framework and renderers from the
 * project's own dependencies and nothing of the build comes with it.
 */
export async function buildProject(root: string, io: Io): Promise<number> {
  const src = join(root, "src");
  const found = discoverAssemblies(join(src, "assemblies"));
  const pages = discoverPages(join(src, "pages"));
  const apis = discoverApis(join(src, "api"));
  const problems = [
    ...found.problems,
    ...pages.problems,
    ...apis.problems,
    ...buildProblems(root, found.assemblies),
  ];
  const needsSvelte = found.assemblies.some((assembly) => assembly.renderer === "svelte");
  const svelte = needsSvelte ? await loadSvelteCompiler(root) : undefined;
  if (needsSvelte && svelte === undefined && problems.length === 0) {
    problems.push({
      path: join(root, "package.json"),
      rule: "a-view-needs-its-renderer",
      message: "the project's svelte package has no compiler this build can load",
      fix: "reinstall svelte",
    });
  }
  if (problems.length > 0) {
    for (const problem of problems) io.error(`${problem.message}: ${problem.fix}`);
    return 1;
  }

  const generated = join(root, ".assemblejs");
  // Both are rewritten whole, so nothing a previous build wrote can outlive what made it.
  rmSync(join(root, "dist"), { recursive: true, force: true });
  rmSync(generated, { recursive: true, force: true });
  const browser = found.assemblies.filter(
    (assembly) => assembly.renderer !== "html" || assembly.client !== undefined,
  );

  try {
    const componentCss = new Map<string, string>();
    const script =
      browser.length === 0
        ? undefined
        : await bundleClient(root, browser, svelte, io, (file, css) => componentCss.set(file, css));
    const styles = writeStyles(root, found.assemblies, componentCss, io);
    const packages = Object.fromEntries(
      Object.values(RENDERER_PACKAGES).map((known) => [known.name, known.package]),
    );
    io.write(
      join(generated, "assemblies.ts"),
      generateRegistry(found.assemblies, {
        from: generated,
        script,
        styles,
        packages,
      }),
    );
    io.write(join(generated, "pages.ts"), generatePages(pages.pages, generated));
    io.write(join(generated, "apis.ts"), generateApis(apis.apis, generated));
    io.write(
      join(generated, "project.ts"),
      generateProject({
        version: sourceVersion(root),
        client: script !== undefined || styles.size > 0,
        config: existsSync(join(root, "assemblejs.config.ts")),
      }),
    );
    await build({
      ...sharedOptions(root, svelte, "server"),
      entryPoints: [join(src, "server.ts")],
      platform: "node",
      format: "esm",
      target: "node22",
      packages: "external",
      outfile: join(root, "dist", "server.js"),
    });
  } catch (error) {
    for (const line of describeBuildFailure(error)) io.error(line);
    return 1;
  }

  io.log(
    `built ${found.assemblies.length} assembly(s), ${pages.pages.length} page(s), ${apis.apis.length} api(s) into dist/`,
  );
  return 0;
}
