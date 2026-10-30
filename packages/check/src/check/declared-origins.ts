// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";
import { UNWRITTEN } from "./unwritten.js";

/**
 * Every remote origin a project's config declares as a literal, in its `remotes`, read without
 * running it, and whether those are all of them.
 *
 * Where a server is, is known only where the project runs, so an origin is read from the
 * environment as often as it is written. A remote declared that way is not seen here, nor one
 * in a list that is computed or spread from another; `whole` is then false, and a placement
 * from an origin that was not read is not known to be undeclared. Boot holds every placement to
 * the remotes the project really declares.
 */
export async function declaredOrigins(source: string): Promise<{
  readonly origins: ReadonlySet<string>;
  readonly whole: boolean;
}> {
  const origins = new Set<string>();
  if (source.trim() === "") return { origins, whole: true };
  const config = await readDefaultExport(source);
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return { origins, whole: false };
  }
  const fields = config as { readonly [key: string]: LiteralValue; readonly [UNWRITTEN]?: true };
  if (!Object.hasOwn(fields, "remotes")) return { origins, whole: fields[UNWRITTEN] !== true };
  const remotes = fields["remotes"];
  if (!Array.isArray(remotes)) return { origins, whole: false };
  let whole = true;
  for (const remote of remotes as readonly LiteralValue[]) {
    const origin =
      remote === null || typeof remote !== "object" || Array.isArray(remote)
        ? undefined
        : (remote as Record<string, LiteralValue>)["origin"];
    if (typeof origin === "string") origins.add(origin);
    else whole = false;
  }
  return { origins, whole };
}
