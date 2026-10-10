// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_VIEW } from "@assemblejs/core";
import { collectPlacements } from "./collect-placements.js";
import { importedAs } from "./imported-as.js";
import type { ViewPlacements } from "./view-placements.js";

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const STRING = /^(["'`])([^"'`$]*)\1$/;

/**
 * The slots a Svelte component's markup places, read from its source as text: every call of
 * the renderer's `slot("...")` outside its script and style, under whatever name the script
 * imports it. A view written as a string is read; one that is computed is left out of the
 * placement; a name that is computed is reported.
 */
export function sveltePlacements(source: string): ViewPlacements {
  const markup = source.replace(SCRIPT_OR_STYLE, "");
  const found: { name: string | undefined; view: string | undefined; shown: string }[] = [];
  for (const local of importedAs(source, "slot")) {
    // A name under a namespace holds a dot, which is the one character of it a pattern reads.
    for (const [call, written = ""] of markup.matchAll(
      new RegExp(`(?<![\\w$.])${local.replace(".", "\\.")}\\(([^)]*)\\)`, "g"),
    )) {
      const [name = "", view] = written.split(",").map((one) => one.trim());
      found.push({
        name: STRING.exec(name)?.[2],
        view: view === undefined || view === "" ? DEFAULT_VIEW : STRING.exec(view)?.[2],
        shown: call,
      });
    }
  }
  return collectPlacements(found);
}
