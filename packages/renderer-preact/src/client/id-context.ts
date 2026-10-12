// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createContext } from "preact";

/**
 * The id of the placement this assembly was mounted for, as its envelope carries it; nothing
 * outside an assembly.
 *
 * A context for the reason the events are one: two assemblies on a page each hold their own.
 */
export const IdContext = createContext("");
