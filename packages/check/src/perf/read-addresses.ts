// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "../check/literal-value.js";
import { readDefaultExport } from "../check/read-default-export.js";
import { UNWRITTEN } from "../check/unwritten.js";
import type { DeclaredAddresses } from "./declared-addresses.js";

const NONE: DeclaredAddresses = { addresses: {}, whole: true, problems: [] };

/** The page addresses a config declares, read off its source, never run. Throws if it does not compile. */
export function readAddresses(source: string): DeclaredAddresses {
  // A config built by a spread or a call that writes none beside it is not `whole`: it may
  // declare some, and `readBudgets` already says such a config cannot be read.
  if (source.trim() === "") return NONE;
  const config = readDefaultExport(source);
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return { ...NONE, whole: false };
  }
  const fields = config as Record<string, LiteralValue>;
  if (!("addresses" in fields)) return { ...NONE, whole: !(UNWRITTEN in fields) };
  const declared = fields["addresses"];
  const refused = (problem: string): DeclaredAddresses => ({ ...NONE, problems: [problem] });
  if (declared === undefined) {
    return refused("addresses is not written as an object of routes and paths; write it as one");
  }
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) {
    return refused("addresses is not an object of routes and paths");
  }
  if (UNWRITTEN in declared) {
    return refused(
      "addresses has a spread or a computed key; write every route as its name and address",
    );
  }
  const problems: string[] = [];
  const addresses: Record<string, string> = {};
  for (const [route, address] of Object.entries(declared)) {
    if (typeof address === "string") addresses[route] = address;
    else problems.push(`the address for "${route}" is not written as a string; write it as a path`);
  }
  return { addresses, whole: true, problems };
}
