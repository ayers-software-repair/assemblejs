// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const MOUNT = /^\s*export\s+const\s+mount\s*[:=]/m;

/**
 * Whether a view's source exports its own `mount`, which is how a framework view says when its
 * browser half runs: `export const mount = "visible"` beside the component, or in a Svelte
 * component's module script. Read from the source, so the generated registry only names an
 * export that exists.
 */
export function declaresMount(source: string): boolean {
  return MOUNT.test(source);
}
