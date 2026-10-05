// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import {
  apiProblems,
  findPlacements,
  opensRuntime,
  pageRouteProblems,
  placementProblems,
  remotePlacementProblems,
  routeKey,
  streamPaths,
  streamProblems,
} from "@assemblejs/core";
import type { ApiDefinition, PlacedAssembly } from "@assemblejs/core";
import { buildProblems } from "../build/build-problems.js";
import { templateProblems } from "../build/template-problems.js";
import { discoverApis } from "../discovery/discover-apis.js";
import { discoverAssemblies } from "../discovery/discover-assemblies.js";
import { discoverPages } from "../discovery/discover-pages.js";
import { isStaticView } from "../discovery/is-static-view.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { declaredOrigins } from "./declared-origins.js";
import type { PagePolicy } from "./page-policy.js";
import { pageRoute } from "./page-route.js";
import { readApi } from "./read-api.js";
import { readPagePolicy } from "./read-page-policy.js";
import { readViewMount } from "./read-view-mount.js";

const NO_POLICY: PagePolicy = { place: {}, remote: new Map(), stream: undefined };
const POLICY_FIX =
  "declare policy only for a name the template places, as the server reads it: defer or required, a positive deadline in milliseconds, a cache only on a placement rendered with the page";
const STREAM_FIX =
  "name the path of one of this server's streaming apis, without parameters, on a page that places an assembly of this server's with a browser half";

/**
 * Everything wrong with a project that can be known without building it, each as a structure
 * with the file, the rule and the fix: the tree (assemblies, pages, apis), the renderers it
 * needs, every page's placements and policy against the assemblies that exist, by the rules boot
 * refuses them by, or, for a placement its page declares from another server, against the
 * remotes `assemblejs.config.ts` declares, the stream a page names, and every template view
 * compiled with the project's own engine. In process, no shell, so the command line and the
 * agent surface report the same findings the same way.
 */
export async function checkProject(root: string): Promise<readonly ProjectProblem[]> {
  const src = join(root, "src");
  const assemblies = discoverAssemblies(join(src, "assemblies"));
  const pages = discoverPages(join(src, "pages"));
  const apis = discoverApis(join(src, "api"));
  const names = assemblies.assemblies.map((assembly) => assembly.name);
  // What the placement rules read of each assembly: in a project, one view, and a browser half
  // for a framework view that does not declare `mount = "none"` for itself, or a static view
  // with a .client.ts beside it.
  const placeable = new Map<string, PlacedAssembly>(
    assemblies.assemblies.map((assembly) => [
      assembly.name,
      {
        views: ["default"],
        browserHalf: isStaticView(assembly.renderer)
          ? assembly.client !== undefined
          : readViewMount(isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view)) !==
            "none",
      },
    ]),
  );
  const problems: ProjectProblem[] = [
    ...assemblies.problems,
    ...pages.problems,
    ...apis.problems,
    ...buildProblems(root, assemblies.assemblies),
    ...(await templateProblems(root, assemblies.assemblies)),
  ];

  // A file that cannot be read is a finding against it, never a throw out of check.
  const readOr = <T>(file: string, read: (source: string) => T, otherwise: T): T => {
    try {
      return read(readFileSync(file, "utf8"));
    } catch (error) {
      problems.push({
        path: file,
        rule: "a-placement-names-an-assembly",
        message: `${file} could not be read: ${error instanceof Error ? error.message : String(error)}`,
        fix: "correct the file so it compiles",
      });
      return otherwise;
    }
  };
  const configFile = join(root, "assemblejs.config.ts");
  const origins = existsSync(configFile)
    ? readOr(configFile, declaredOrigins, new Set<string>())
    : new Set<string>();
  // Each api's route, held to the rules boot holds it to by the same function, and each GET one
  // kept by what the router matches, so a page at the same route is refused as boot refuses it.
  // An api file that cannot be read is reported by its own rules.
  const declaredApis: ApiDefinition[] = [];
  const apiRoutes = new Map<string, string>();
  for (const file of apis.apis) {
    let api;
    try {
      api = readApi(file);
    } catch {
      api = undefined;
    }
    if (api === undefined) continue;
    // Core reports in declaration order, so what follows the earlier apis' problems is this one's.
    for (const problem of apiProblems([...declaredApis, api]).slice(
      apiProblems(declaredApis).length,
    )) {
      problems.push({
        path: file,
        rule: "an-api-file-is-an-api",
        message: problem,
        fix: "give the api a route of its own, starting with /, outside the framework's prefixes",
      });
    }
    declaredApis.push(api);
    if ((api.method ?? "GET") === "GET") apiRoutes.set(routeKey("GET", api.path), file);
  }
  const streams = streamPaths(declaredApis);
  const routes = new Map<string, string>();
  for (const page of pages.pages) {
    const policy =
      page.declaration === undefined
        ? NO_POLICY
        : readOr(page.declaration, readPagePolicy, NO_POLICY);
    // Every rule the server refuses a route by at boot, from the same function.
    let route: string | undefined = page.route;
    try {
      route = pageRoute(root, page);
    } catch {
      // A declaration that cannot be read is reported once, by the reading of its placements.
    }
    const at = page.declaration ?? page.template;
    for (const problem of route === undefined ? [] : pageRouteProblems(route)) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: problem,
        fix: "give the page a route of literal segments, starting with /, outside the framework's prefixes",
      });
    }
    // Keyed as the router matches: two routes that differ only in a parameter's name collide.
    const first = route === undefined ? undefined : routes.get(routeKey("GET", route));
    if (route !== undefined && first !== undefined) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${page.name}" answers at ${route}, as page "${first}" already does`,
        fix: "give one of them another route",
      });
    } else if (route !== undefined) {
      routes.set(routeKey("GET", route), page.name);
    }
    const api = route === undefined ? undefined : apiRoutes.get(routeKey("GET", route));
    if (api !== undefined) {
      problems.push({
        path: at,
        rule: "a-directory-is-a-page",
        message: `page "${page.name}" answers at ${route ?? ""}, as the api ${relative(root, api).split("\\").join("/")} does`,
        fix: "give the page or the api another route",
      });
    }
    const label = `page "${page.name}"`;
    let template;
    let placements;
    try {
      template = readFileSync(page.template, "utf8");
      placements = findPlacements(template);
    } catch (error) {
      problems.push({
        path: page.template,
        rule: "a-placement-names-an-assembly",
        message: error instanceof Error ? error.message : String(error),
        fix: 'write each placement as <assembly name="..."></assembly>',
      });
      // With no placements to read, the stream's path is still held; what would open it is not.
      for (const message of streamProblems(label, policy.stream, streams, undefined)) {
        problems.push({ path: at, rule: "a-page-opens-one-stream", message, fix: STREAM_FIX });
      }
      continue;
    }
    // The rules boot refuses a page by, from the same functions, with a fix for each. A url
    // the declaration computes is not read, so it is not held to them either way.
    for (const placement of placements) {
      const url = policy.remote.get(placement.name);
      if (url === undefined) continue;
      for (const problem of remotePlacementProblems(label, template, placement, url, origins)) {
        problems.push({
          path: problem.about === "form" ? page.template : at,
          rule: "a-placement-names-an-assembly",
          message: problem.message,
          fix:
            problem.about === "url"
              ? "write the url as the assembly's content endpoint, https://host/assembly/<name>/"
              : problem.about === "origin"
                ? `add { origin: "${originOf(url) ?? url}" } to remotes in assemblejs.config.ts`
                : "move the placement out of the form, or place a local assembly there",
        });
      }
    }
    for (const problem of placementProblems(label, placements, policy.place, placeable)) {
      if (problem.about === "policy") {
        problems.push({
          path: at,
          rule: "policy-names-a-placement",
          message: problem.message,
          fix: POLICY_FIX,
        });
      } else if (problem.about === "view") {
        problems.push({
          path: page.template,
          rule: "a-placement-names-an-assembly",
          message: problem.message,
          fix: 'place it without a view, or with "default", the one view an assembly in a project has',
        });
      } else {
        problems.push({
          path: page.template,
          rule: "a-placement-names-an-assembly",
          message: problem.message,
          fix:
            names.length === 0
              ? `add it: assemblejs add assembly ${problem.name}`
              : `add it, or place one that exists: ${names.join(", ")}`,
        });
      }
    }
    const opened = opensRuntime(placements, policy.place, placeable);
    for (const message of streamProblems(label, policy.stream, streams, opened)) {
      problems.push({ path: at, rule: "a-page-opens-one-stream", message, fix: STREAM_FIX });
    }
  }
  return problems.map((problem) => ({
    ...problem,
    path: relative(root, problem.path).split("\\").join("/") || ".",
  }));
}

function originOf(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
