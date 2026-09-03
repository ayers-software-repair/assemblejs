// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { discoverAssemblies } from "@assemblejs/cli";
import { renderEnvelope } from "@assemblejs/core";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import { RENDERABLE_WITHOUT_A_BUILD } from "./renderable-without-a-build.js";
import type { RenderedAssembly } from "./rendered-assembly.js";

/**
 * Renders one assembly NOW and answers with what it produced.
 *
 * This and `composePage` are why the agent surface is not a wrapper around the command line. An
 * agent that has just written an assembly can see what it renders without starting a server,
 * opening a browser, or asking the developer to look. It closes its own loop.
 *
 * A framework view is source that must be compiled, so it is REFUSED with the reason rather
 * than approximated. Showing an agent something that is not what will ship is worse than
 * showing it nothing, because it will believe it.
 */
export function renderAssembly(root: ProjectRoot, name: string): RenderedAssembly {
  const { assemblies } = discoverAssemblies(withinRoot(root, "src", "assemblies"));
  const found = assemblies.find((assembly) => assembly.name === name);

  if (found === undefined) {
    return {
      name,
      view: "default",
      renderer: "unknown",
      html: "",
      data: {},
      problems: [
        assemblies.length === 0
          ? `there is no assembly "${name}", and this project has none at all yet`
          : `there is no assembly "${name}". This project has: ${assemblies.map((a) => a.name).join(", ")}`,
      ],
    };
  }

  if (!RENDERABLE_WITHOUT_A_BUILD.includes(found.renderer)) {
    return {
      name,
      view: "default",
      renderer: found.renderer,
      html: "",
      data: {},
      problems: [
        `"${name}" is a ${found.renderer} assembly, which is source that has to be compiled before it renders. Build the project and render it from the running server instead. Showing you an approximation here would be showing you something that is not what ships.`,
      ],
    };
  }

  const markup = readFileSync(withinRoot(root, found.view), "utf8");
  const data = {};
  return {
    name,
    view: "default",
    renderer: found.renderer,
    html: renderEnvelope({
      id: `preview-${name}`,
      name,
      view: "default",
      renderer: found.renderer,
      markup,
      data,
    }),
    data,
    problems: [],
  };
}
