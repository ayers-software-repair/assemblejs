// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Expression, Program } from "acorn";

/** What a module declares a name as, at its top level, when it declares it with a value. */
export function initialiserOf(program: Program, name: string): Expression | undefined {
  for (const statement of program.body) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const declarator of statement.declarations) {
      if (declarator.id.type === "Identifier" && declarator.id.name === name) {
        return declarator.init ?? undefined;
      }
    }
  }
  return undefined;
}
