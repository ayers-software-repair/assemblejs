// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import type { Component } from "svelte";
import { render } from "svelte/server";

/**
 * Renders a Svelte component to the markup the server sends.
 *
 * Svelte's server render answers a head and a body. Only the body belongs in the envelope: the
 * head is page-level, and an assembly that wrote into the document head from inside its own
 * fragment would be writing outside the boundary the whole design draws.
 *
 * It does not catch. A failed render throws and the composer falls back. The component gets the
 * server's events as the same prop it hydrates with, so it reads \`events\` without asking which
 * side it is on.
 */
export function renderToMarkup(component: unknown, input: MarkupInput): string {
  // Typed as a component taking the two props every assembly receives, rather than cast to
  // never: never makes the props argument uncheckable, which is the opposite of what a cast
  // here should buy.
  const { body } = render(component as Component<Record<string, unknown>>, {
    props: { data: input.data, children: input.children, events: serverEvents() },
  });
  return body;
}
