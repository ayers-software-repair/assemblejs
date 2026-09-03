// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** A safe identifier for an assembly, so the generated module compiles whatever the name is. */
export function identifierFor(name: string): string {
  const camel = name.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
  return `assembly_${camel}`;
}
