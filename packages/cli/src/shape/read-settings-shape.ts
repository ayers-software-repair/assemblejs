// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readDefaultExport } from "../check/read-default-export.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { COMPUTED } from "./computed.js";
import { fieldAsWritten } from "./field-as-written.js";
import { fieldsOf } from "./fields-of.js";
import type { SettingsShape } from "./settings-shape.js";
import { UNREAD } from "./unread.js";

// The config's name, from the project's root.
const CONFIG = "assemblejs.config.ts";

/**
 * What a project's config declares, read and never run, by naming each field that is shown, so
 * nothing the config holds reaches a reader because it happened to be there. A project with no
 * config declares nothing, which is every field at what its absence means.
 */
export function readSettingsShape(root: string): SettingsShape {
  const nothing = {
    remotes: [],
    publicRoutes: [],
    contentSecurityPolicy: null,
    authenticate: false,
    budgets: {},
  };
  const file = join(root, CONFIG);
  if (!existsSync(file)) return nothing;
  const all = (mark: string): SettingsShape => ({
    file: CONFIG,
    remotes: mark,
    publicRoutes: mark,
    contentSecurityPolicy: mark,
    authenticate: mark,
    budgets: mark,
  });
  let declared;
  try {
    declared = fieldsOf(readDefaultExport(readFileSync(file, "utf8")));
  } catch {
    return all(UNREAD);
  }
  if (declared === undefined) return all(COMPUTED);
  return {
    file: CONFIG,
    remotes: fieldAsWritten(declared, "remotes", nothing.remotes),
    publicRoutes: fieldAsWritten(declared, "publicRoutes", nothing.publicRoutes),
    contentSecurityPolicy: fieldAsWritten(declared, "contentSecurityPolicy", null),
    authenticate: "authenticate" in declared ? true : UNWRITTEN in declared ? COMPUTED : false,
    budgets: fieldAsWritten(declared, "budgets", nothing.budgets),
  };
}
