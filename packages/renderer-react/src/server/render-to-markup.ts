// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { serverEvents } from "@assemblejs/core/client";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { EventsContext } from "../client/events-context.js";
import type { AssemblyProps } from "../props/assembly-props.js";

/**
 * Renders a React component to the markup the server sends.
 *
 * It does not catch. A failed render throws, the composer catches it, and the placement falls
 * back. A renderer that returned its own error markup would produce something that passes every
 * check downstream, so the page looks fine and is wrong.
 *
 * The component renders inside the same events context it hydrates inside, holding the server's
 * events, so a component that calls `useEvents()` renders on the server as it does in the
 * browser instead of failing for want of a page.
 */
export function renderToMarkup(
  component: (props: AssemblyProps) => unknown,
  input: MarkupInput,
): string {
  return renderToString(
    createElement(
      EventsContext.Provider,
      { value: serverEvents() },
      createElement(component as never, { data: input.data }),
    ),
  );
}
