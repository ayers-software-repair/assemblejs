// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageDeclaration } from "./page-declaration.js";

/** Identity, for inference and for a name at the point of declaration. */
export function definePage(declaration: PageDeclaration): PageDeclaration {
  return declaration;
}
