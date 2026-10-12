// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Every script a build wrote for the browser. */
export function builtScripts(root: string): string[] {
  return existsSync(join(root, "dist", "client"))
    ? readdirSync(join(root, "dist", "client"), { recursive: true, encoding: "utf8" }).filter(
        (file) => file.endsWith(".js"),
      )
    : [];
}
