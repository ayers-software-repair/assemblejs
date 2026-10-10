// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Why a view that is not plain html is refused, not approximated: its file is source that only
 * its renderer turns into markup, and showing the source would be showing what does not ship.
 */
export function needsABuild(name: string, renderer: string): string {
  return `"${name}" is a ${renderer} assembly, whose view is source that only its renderer turns into markup. Build the project and render it from the running server instead. Showing you the source here would be showing you something that is not what ships.`;
}
