// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { html } from "lit";

export default (props: AssemblyProps) =>
  html`<p class="label" data-framework="lit">${String(props.data.label)}</p>`;
