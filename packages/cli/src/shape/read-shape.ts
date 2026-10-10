// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join, resolve } from "node:path";
import { hasBrowserHalf } from "../check/has-browser-half.js";
import { viewFindings } from "../check/view-findings.js";
import { CONFIG_FILE } from "../discovery/config-file.js";
import { discoverApis } from "../discovery/discover-apis.js";
import { discoverAssemblies } from "../discovery/discover-assemblies.js";
import { discoverPages } from "../discovery/discover-pages.js";
import { fromRoot } from "../discovery/from-root.js";
import { outsideProblems } from "../root/outside-problems.js";
import type { AssemblyShape } from "./assembly-shape.js";
import { COMPUTED } from "./computed.js";
import type { ProjectShape } from "./project-shape.js";
import { readApiShape } from "./read-api-shape.js";
import { readPageShape } from "./read-page-shape.js";
import { readSettingsShape } from "./read-settings-shape.js";
import { UNREAD } from "./unread.js";

/**
 * A project's whole shape, read from its sources by the readers `check` holds it with and
 * never run: every page with its route, what it places and under what policy; every assembly
 * with its files, what its view places and where it is placed; every api's route; and what the
 * config declares. One read, so whoever asks does not spend its first turns finding out what
 * exists, and nothing here needs a build.
 */
export function readShape(root: string): ProjectShape {
  const at = resolve(root);
  const found = discoverAssemblies(at);
  const pages = discoverPages(at);
  const apis = discoverApis(at);
  const shown = (path: string): string => fromRoot(at, isAbsolute(path) ? path : join(at, path));
  const views = viewFindings(at, found.assemblies);
  const pageShapes = pages.pages.map((page) => readPageShape(at, page));
  // Whether a list of placements, where it is one and not a mark, names this assembly.
  const placing = (name: string, places: readonly { readonly name: string }[] | string): boolean =>
    typeof places !== "string" && places.some((placed) => placed.name === name);
  const placesOf = new Map<string, AssemblyShape["places"]>(
    found.assemblies.map((assembly) => [
      assembly.name,
      views.unread.has(assembly.name)
        ? UNREAD
        : (views.placements
            .get(assembly.name)
            ?.map(({ name, view }) => ({ name, view: view ?? COMPUTED })) ?? COMPUTED),
    ]),
  );
  return {
    pages: pageShapes,
    assemblies: found.assemblies.map((assembly) => ({
      name: assembly.name,
      directory: shown(assembly.directory),
      view: shown(assembly.view),
      renderer: assembly.renderer,
      ...(assembly.client === undefined ? {} : { client: shown(assembly.client) }),
      ...(assembly.service === undefined ? {} : { service: shown(assembly.service) }),
      styles: assembly.styles.map(shown),
      browserHalf: hasBrowserHalf(at, assembly),
      places: placesOf.get(assembly.name) ?? COMPUTED,
      placedOn: pageShapes
        .filter((page) => placing(assembly.name, page.places))
        .map((page) => page.name),
      placedIn: found.assemblies
        .filter((other) => placing(assembly.name, placesOf.get(other.name) ?? COMPUTED))
        .map((other) => other.name),
    })),
    apis: apis.apis.map((file) => readApiShape(at, file)),
    settings: readSettingsShape(at),
    renderers: [...new Set(found.assemblies.map((assembly) => assembly.renderer))].sort(),
    // The tree's own problems, and everything that leads out of it: a file or a directory
    // discovery met, the config, an import a view climbs out by.
    problems: [
      ...found.problems,
      ...pages.problems,
      ...apis.problems,
      ...outsideProblems(at, [join(at, CONFIG_FILE)]),
      ...views.problems.filter((problem) => problem.rule === "a-project-stays-inside-its-root"),
    ].map((problem) => ({ ...problem, path: shown(problem.path) })),
  };
}
