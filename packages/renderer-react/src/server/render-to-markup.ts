// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { AssemblyProps } from "../props/assembly-props.js";

/**
 * Renders a React component to the markup the server sends.
 *
 * It does not catch. A failed render throws, the composer catches it, and the placement falls
 * back. A renderer that returned its own error markup would produce something that passes every
 * check downstream, so the page looks fine and is wrong.
 */
export function renderToMarkup(
  component: (props: AssemblyProps) => unknown,
  input: MarkupInput,
): string {
  return renderToString(
    createElement(component as never, { data: input.data, children: input.children }),
  );
}
