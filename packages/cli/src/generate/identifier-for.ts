// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A safe identifier for something the generated modules import, so they compile whatever the
 * name is: `identifierFor("view", "hello-react")` is `view_helloReact`.
 */
export function identifierFor(kind: string, name: string): string {
  const camel = name.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
  return `${kind}_${camel}`;
}
