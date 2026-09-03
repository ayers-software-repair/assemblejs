// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "@assemblejs/core/client";
import { createContext } from "react";

/**
 * The events object this assembly was mounted with.
 *
 * A context rather than a module global: two assemblies on one page each hold their own, scoped
 * to them, and a global would hand them both the same one and lose the scoping that makes
 * teardown exact.
 */
export const EventsContext = createContext<Events | undefined>(undefined);
