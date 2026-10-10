// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Written } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { describeProject } from "./describe-project.js";
import type { DescribedAssembly } from "./described-assembly.js";

/**
 * One assembly of the project, or undefined where it has none by that name: its files, its
 * renderer, what its view places, and every placement of it with the policy its page declares
 * for it. Read from the same shape the whole project is, so the two cannot disagree.
 */
export function describeAssembly(root: ProjectRoot, name: string): DescribedAssembly | undefined {
  const project = describeProject(root);
  const found = project.assemblies.find((assembly) => assembly.name === name);
  if (found === undefined) return undefined;
  // A page's policy is keyed by the placement's name where it is written as an object; a mark,
  // or anything else it was written as, is said of every placement on that page.
  const policyFor = (policy: Written): Written =>
    policy !== null && typeof policy === "object" && !Array.isArray(policy)
      ? ((policy as { readonly [key: string]: Written })[name] ?? {})
      : policy;
  return {
    ...found,
    placedOn: project.pages.flatMap((page) =>
      typeof page.places === "string"
        ? []
        : page.places
            .filter((placed) => placed.name === name)
            .map((placed) => ({
              page: page.name,
              route: page.route,
              view: placed.view,
              policy: policyFor(page.policy),
            })),
    ),
    placedIn: project.assemblies.flatMap((other) =>
      typeof other.places === "string"
        ? []
        : other.places
            .filter((placed) => placed.name === name)
            .map((placed) => ({ assembly: other.name, view: placed.view })),
    ),
  };
}
