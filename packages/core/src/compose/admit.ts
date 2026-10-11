// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Admission } from "./admission.js";

/**
 * Asks, for one placement of an assembly this server answers for, whether the visitor the
 * request belongs to may be shown it: the decision the assembly's own address would make of
 * that visitor, made again where it is placed. The server binds it to the request, so nothing
 * of the visitor reaches the composer but the answer.
 */
export type Admit = (name: string, view: string) => Admission | Promise<Admission>;
