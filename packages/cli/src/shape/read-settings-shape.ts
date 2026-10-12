// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_FILE } from "@assemblejs/build";
import { leadsOut } from "@assemblejs/build";
import { readInside } from "@assemblejs/build";
import { readDefaultExport } from "../check/read-default-export.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { COMPUTED } from "./computed.js";
import { fieldAsWritten } from "./field-as-written.js";
import { fieldsOf } from "./fields-of.js";
import type { SettingsShape } from "./settings-shape.js";
import { UNREAD } from "./unread.js";

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
    limits: {},
    outline: false,
  };
  const file = join(root, CONFIG_FILE);
  // A config that leads out of the project is one the project has, and is not opened.
  if (!existsSync(file) && !leadsOut(root, file)) return nothing;
  const all = (mark: string): SettingsShape => ({
    file: CONFIG_FILE,
    remotes: mark,
    publicRoutes: mark,
    contentSecurityPolicy: mark,
    authenticate: mark,
    budgets: mark,
    limits: mark,
    outline: mark,
  });
  let declared;
  try {
    declared = fieldsOf(readDefaultExport(readInside(root, file)));
  } catch {
    return all(UNREAD);
  }
  if (declared === undefined) return all(COMPUTED);
  return {
    file: CONFIG_FILE,
    remotes: fieldAsWritten(declared, "remotes", nothing.remotes),
    publicRoutes: fieldAsWritten(declared, "publicRoutes", nothing.publicRoutes),
    contentSecurityPolicy: fieldAsWritten(declared, "contentSecurityPolicy", null),
    authenticate: "authenticate" in declared ? true : UNWRITTEN in declared ? COMPUTED : false,
    budgets: fieldAsWritten(declared, "budgets", nothing.budgets),
    limits: fieldAsWritten(declared, "limits", nothing.limits),
    outline: fieldAsWritten(declared, "outline", nothing.outline),
  };
}
