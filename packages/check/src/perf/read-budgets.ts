// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageBudgets } from "@assemblejs/core";
import type { LiteralValue } from "../check/literal-value.js";
import { readDefaultExport } from "../check/read-default-export.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { PAGE_PARTS } from "./page-parts.js";

/**
 * The page budgets a project's config declares, read from its source and never run, with
 * everything wrong with them: budgets not written as an object, or not written whole (a
 * spread or a computed key among them), a part that is not one a page sends, and a budget that
 * is not a whole number of bytes above zero, one not written as a number (computed, or a name
 * such as `Infinity`) included, since a budget `perf`
 * cannot read is one it cannot hold a page to. A config written as one literal object that
 * declares none has none; one that is not (computed, or with a spread or a computed key) is
 * refused unless it writes budgets beside what it brings in. Throws for a config that cannot be
 * compiled.
 */
export function readBudgets(source: string): {
  readonly budgets: PageBudgets;
  readonly problems: readonly string[];
} {
  const config = readDefaultExport(source);
  const fields =
    config !== null && typeof config === "object" && !Array.isArray(config)
      ? (config as Record<string, LiteralValue>)
      : undefined;
  if (fields === undefined || UNWRITTEN in fields) {
    // What a config brings in by a spread, or builds, could hold budgets: whether pages are
    // held cannot be read, unless budgets are written beside it, `{}` to say none.
    return "budgets" in (fields ?? {})
      ? readDeclared((fields as Record<string, LiteralValue>)["budgets"])
      : {
          budgets: {},
          problems: [
            "the config is not written as one literal object, so whether it declares budgets cannot be read; write budgets in it, {} for none",
          ],
        };
  }
  if (!("budgets" in fields)) return { budgets: {}, problems: [] };
  return readDeclared(fields["budgets"]);
}

function readDeclared(declared: LiteralValue): {
  readonly budgets: PageBudgets;
  readonly problems: readonly string[];
} {
  if (declared === undefined) {
    return {
      budgets: {},
      problems: ["budgets is not written as an object of parts and bytes; write it as one"],
    };
  }
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) {
    return { budgets: {}, problems: ["budgets is not an object of parts and bytes"] };
  }
  if (UNWRITTEN in declared) {
    return {
      budgets: {},
      problems: ["budgets has a spread or a computed key; write every part as its name and bytes"],
    };
  }
  const problems: string[] = [];
  const budgets: Record<string, number> = {};
  for (const [part, bytes] of Object.entries(declared)) {
    if (!(PAGE_PARTS as readonly string[]).includes(part)) {
      problems.push(
        `budgets names "${part}", which is not a part a page sends: ${PAGE_PARTS.join(", ")}`,
      );
    } else if (typeof bytes !== "number" || !Number.isInteger(bytes) || bytes <= 0) {
      problems.push(
        `the budget for ${part} is ${bytes === undefined ? "not written as a number" : "not a whole number of bytes above zero"}; write it as a whole number of bytes above zero`,
      );
    } else {
      budgets[part] = bytes;
    }
  }
  return { budgets, problems };
}
