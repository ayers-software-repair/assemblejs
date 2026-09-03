// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RenderInput } from "./render-input.js";

/**
 * A renderer turns one view into HTML on the server. It does not catch: a failed render throws
 * and the composer falls back, because a renderer that returns its own error markup produces
 * something that passes every check downstream.
 */
export interface Renderer {
  readonly name: string;
  readonly extensions: readonly string[];
  render(input: RenderInput): string | Promise<string>;
}
