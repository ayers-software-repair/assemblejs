// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { html } from "lit";
import { describe, expect, it } from "vitest";
import type { LitView } from "@assemblejs/renderer-lit";

describe("a Lit view", () => {
  it("is a function from the assembly's props to a template", () => {
    const view: LitView = (props) => html`<p>${String(props.data["n"])}</p>`;
    expect(typeof view).toBe("function");
  });
});
