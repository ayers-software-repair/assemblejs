// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@asmjs/core";
import type { TemplateResult } from "lit";
import type { AssemblyProps } from "./assembly-props.js";

/**
 * A Lit view: the assembly's props to the template both halves render. The shape of its data is
 * its author's to say, as it is of every view's props.
 */
export type LitView<D extends JsonObject = JsonObject> = (
  props: AssemblyProps<D>,
) => TemplateResult;
