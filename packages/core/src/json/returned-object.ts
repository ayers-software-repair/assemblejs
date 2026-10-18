// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ReturnedValue } from "./returned-value.js";

/** What a service returns: an object whose members may be absent, because JSON drops them. */
export type ReturnedObject = { [key: string]: ReturnedValue | undefined };
