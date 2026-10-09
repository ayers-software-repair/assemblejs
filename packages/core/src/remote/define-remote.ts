// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RemoteDefinition } from "./remote-definition.js";

/** Identity, for inference and for a name at the point of declaration. */
export function defineRemote(definition: RemoteDefinition): RemoteDefinition {
  return definition;
}
