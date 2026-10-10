// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import { EventsContext } from "../client/events-context.js";
import type { AssemblyProps } from "../props/assembly-props.js";

/**
 * Renders a Preact component to the markup the server sends.
 *
 * It does not catch. A failed render throws, the composer catches it, and the placement falls
 * back; a renderer that returned its own error markup would pass every check downstream.
 *
 * The component renders inside the same events context it hydrates inside, holding the server's
 * events, so a component that calls `useEvents()` renders on the server as in the browser.
 */
export function renderToMarkup(
  component: (props: AssemblyProps) => unknown,
  input: MarkupInput,
): string {
  return renderToString(
    h(
      EventsContext.Provider,
      { value: serverEvents() },
      h(component as never, { data: input.data }),
    ),
  );
}
