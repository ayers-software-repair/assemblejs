// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { aRenderer } from "@assemblejs/cli";

/**
 * Why a view that is not plain html is refused, not approximated, while no dev server runs: its
 * file is source that only its renderer turns into markup, and showing the source would be
 * showing what does not ship. The project's own dev server renders it, and the agent surface
 * asks that server when it finds one running (DESIGN 13.4).
 */
export function needsTheDevServer(name: string, renderer: string): string {
  return `"${name}" is ${aRenderer(renderer)} assembly, whose view is source that only its renderer turns into markup. Start the project's dev server (npx assemblejs dev) and ask again: it is then rendered by the server itself, as it will ship. Showing you the source here would be showing you something that is not what ships.`;
}
