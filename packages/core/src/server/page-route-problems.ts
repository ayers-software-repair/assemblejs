// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isFlatRoute } from "./is-flat-route.js";
import { reservedPrefix } from "./reserved-prefix.js";

/**
 * Everything wrong with one page's route on its own, each a sentence naming it: the rules the
 * server refuses at boot, read by the command line's check too, so the two cannot disagree.
 */
export function pageRouteProblems(route: string): readonly string[] {
  const problems: string[] = [];
  const at = `page "${route}"`;
  if (!route.startsWith("/")) problems.push(`${at} does not start with "/"`);
  if (route.includes("*")) {
    problems.push(`${at} uses a wildcard; routes are a flat table with parameters`);
  } else if (route.startsWith("/") && !isFlatRoute(route)) {
    problems.push(`${at} is not a flat path of literal segments and whole-segment :parameters`);
  }
  const reserved = reservedPrefix(route);
  if (reserved !== undefined) {
    problems.push(`${at} is under "${reserved}/", which the framework reserves`);
  }
  return problems;
}
