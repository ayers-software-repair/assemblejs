// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "@assemblejs/core/client";
import type { InjectionKey } from "vue";

/**
 * What the events object this assembly was mounted with is provided under.
 *
 * Provided per app, and every assembly is its own app, so two assemblies on one page each hold
 * their own, scoped to them.
 */
export const EVENTS_KEY: InjectionKey<Events> = Symbol("assemblejs events");
