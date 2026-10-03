// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer } from "@assemblejs/core/client";
import { LitElement } from "lit";

// Loads Lit's element base from a module of its own, which a bundler may evaluate before the Lit
// renderer's: the Lit assembly beside it must still hydrate rather than re-render.
const renderer: ClientRenderer = {
  mount: (element) => {
    element.querySelector("p")?.setAttribute("data-lit", typeof LitElement);
    return { unmount: () => undefined };
  },
};
export default renderer;
