// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MarkupInput } from "@assemblejs/core";

/** A template compiled once, rendered for each placement with that placement's input. */
export type CompiledTemplate = (input: MarkupInput) => string;
