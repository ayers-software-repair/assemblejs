// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import { DEFAULT_LIMITS, localFetch } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";
import { fallbackProblems } from "../compose/fallback-problems.js";
import type { ProjectRoot } from "../root/project-root.js";
import { devServerFetch } from "./dev-server-fetch.js";
import { devServerUrl } from "./dev-server-url.js";
import { islandData } from "./island-data.js";
import { needsTheDevServer } from "./needs-the-dev-server.js";
import { noSuchAssembly } from "./no-such-assembly.js";
import { projectAssemblies } from "./project-assemblies.js";
import { RENDERABLE_WITHOUT_A_BUILD } from "./renderable-without-a-build.js";
import type { RenderedAssembly } from "./rendered-assembly.js";

/**
 * Renders one assembly NOW, through the transport a server renders it with, and answers with
 * what it produced: its envelope, every assembly its view places composed inside it, and the
 * account of each of those.
 *
 * This and `composePage` are why the agent surface is not a wrapper around the command line. An
 * agent that has just written an assembly can see what it renders without starting a server,
 * opening a browser, or asking the developer to look. It closes its own loop.
 *
 * While the project's own dev server runs, that server is asked instead, for any assembly: what
 * comes back is what it serves, framework and template views included, and nothing of the
 * project's code runs here (DESIGN 13.4). Without one, a framework or template view is source
 * that only its renderer turns into markup, so it is REFUSED with the reason rather than
 * approximated. Showing an agent something that is not what will ship is worse than showing it
 * nothing, because it will believe it. A child that is one is shown as the server shows a child
 * that did not render, with that reason among the problems.
 */
export async function renderAssembly(root: ProjectRoot, name: string): Promise<RenderedAssembly> {
  const assemblies = projectAssemblies(root);
  const names = [...assemblies.keys()];
  const renderer = assemblies.get(name)?.views["default"]?.renderer;
  const refused = (problem: string): RenderedAssembly => ({
    name,
    view: "default",
    renderer: renderer ?? "unknown",
    html: "",
    data: {},
    children: [],
    problems: [problem],
  });
  if (renderer === undefined) return refused(noSuchAssembly(name, names));
  const dev = await devServerUrl(root);
  if (dev === undefined && !RENDERABLE_WITHOUT_A_BUILD.includes(renderer)) {
    return refused(needsTheDevServer(name, renderer));
  }

  const logged: LogLine[] = [];
  const inside: string[] = [];
  const fetch =
    dev === undefined
      ? localFetch(assemblies, (line) => logged.push(line), DEFAULT_LIMITS)
      : devServerFetch(
          dev,
          (line) => logged.push(line),
          (problem) => inside.push(problem),
        );
  // The ids a page's composer sends, which the content endpoint holds to their shape and
  // refuses a request without (DESIGN 2.1).
  const id = randomUUID();
  const answer = await fetch({
    name,
    view: "default",
    id,
    page: randomUUID(),
    // As a page's placement is asked: one deep, with nothing above it.
    depth: 1,
    path: [],
    query: new URLSearchParams(),
    params: {},
    headers: {},
    signal: new AbortController().signal,
  });
  if (!answer.ok) {
    return refused(
      logged.map((line) => line.message).join("; ") || (answer.detail ?? answer.reason),
    );
  }
  const children = answer.nested ?? [];
  return {
    name,
    view: "default",
    renderer,
    html: answer.html,
    // What the island of the envelope it answered carries: what the assembly's services
    // returned where it was rendered, which is nothing for a view rendered here with none.
    data: islandData(answer.html, id),
    children,
    problems: fallbackProblems(children, names, logged, inside),
  };
}
