// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateResult } from "lit";
import type { AssemblyProps } from "./assembly-props.js";

/** A Lit view: the assembly's props to the template both halves render. */
export type LitView = (props: AssemblyProps) => TemplateResult;
